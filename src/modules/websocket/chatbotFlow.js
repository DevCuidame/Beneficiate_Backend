const userRepository = require('../users/user.repository');
const appointmentService = require('../appointment/appointment.service');
const medicalSpecialtiesService = require('../medical_specialties/medical_specialties.service');
const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');

const STATES = {
  AWAITING_DOCUMENT: 'awaiting_document',
  AWAITING_SPECIALTY: 'awaiting_specialty',
  AWAITING_CONSULT_REASON: 'awaiting_consult_reason',
  AWAITING_DESCRIPTION: 'awaiting_description',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed',
};

async function validateDocument(document, userId) {
  if (!document || document.length < 6) {
    return { valid: false, error: 'Documento inválido o incompleto.' };
  }

  const user = await userRepository.getUserByIdNum(document);
  const beneficiary = await beneficiaryRepository.findByIdentification(
    document
  );

  if (user && user.identification_number === document) {
    const belongsTo = `${user.first_name.split(' ')[0]} ${
      user.last_name.split(' ')[0]
    }`;
    return { valid: true, belongsTo, type: 'user' };
  }

  if (beneficiary) {
    if (beneficiary.user_id !== userId) {
      return {
        valid: false,
        error: 'Solo puede agendar citas para sus propios beneficiarios.',
      };
    }
    
    const belongsTo = `${beneficiary.first_name.split(' ')[0]} ${
      beneficiary.last_name.split(' ')[0]
    }`;
    return { 
      valid: true, 
      belongsTo, 
      type: 'beneficiary', 
      id: beneficiary.id 
    };
  }


  return {
    valid: false,
    error: 'El documento no coincide con nuestros registros. Intenta de nuevo.',
  };
}

function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

async function handleChatbotFlow(ws, data) {
  try {
    if (
      (data.event && data.event === 'init') ||
      data.event === 'chatbot_init'
    ) {
      ws.professionalId = data.professionalId;
      if (!ws.botState) {
        ws.botState = STATES.AWAITING_DOCUMENT;
        const welcomeMsg = {
          event: 'chatbot_message',
          message:
            'Bienvenido al chat de citas. Para empezar, por favor ingresa el documento de identidad de la persona que necesita la cita, sin espacios ni puntos.',
          sender_type: 'BOT',
          professionalId: ws.professionalId,
        };
        sendMessage(ws, welcomeMsg);
      }
      return;
    }

    switch (ws.botState) {
      case STATES.AWAITING_DOCUMENT: {
        const document = data.message;
        const validationResult = await validateDocument(document, ws.user.id);
        if (!validationResult.valid) {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: validationResult.error,
            sender_type: 'BOT',
          });
          return;
        }

        const specialties = await medicalSpecialtiesService.getAll();

        sendMessage(ws, {
          event: 'chatbot_message',
          message: `Documento validado como ${validationResult.belongsTo}. Por favor, seleccione la especialidad de la consulta.`,
          sender_type: 'BOT',
          list: true,
          options: specialties.map((s) => s.name),
        });

        ws.botState = STATES.AWAITING_SPECIALTY;
        break;
      }
      case STATES.AWAITING_SPECIALTY: {
        const selectedSpecialtyName = data.message.trim();
        const specialties = await medicalSpecialtiesService.getAll();
        const specialtyFound = specialties.find(
          (specialty) =>
            specialty.name.toLowerCase() === selectedSpecialtyName.toLowerCase()
        );

        if (!specialtyFound) {
          sendMessage(ws, {
            event: 'chatbot_message',
            message:
              'La especialidad seleccionada no es válida. Por favor, seleccione una de las siguientes opciones: ' +
              specialties.map((s) => s.name).join(', '),
            sender_type: 'BOT',
          });
          return;
        }

        ws.flowData = ws.flowData || {};
        ws.flowData.specialty = specialtyFound.name;
        ws.flowData.specialty_id = specialtyFound.id;

        sendMessage(ws, {
          event: 'chatbot_message',
          message:
            'Gracias. Ahora, por favor, brinde una descripción detallada de su motivo de consulta.',
          sender_type: 'BOT',
        });

        ws.botState = STATES.AWAITING_DESCRIPTION;
        break;
      }
      case STATES.AWAITING_CONSULT_REASON: {
        const consultReason = data.message;
        ws.flowData = ws.flowData || {};
        ws.flowData.consultReason = consultReason;
        sendMessage(ws, {
          event: 'chatbot_message',
          message:
            'Gracias. Ahora, por favor, brinde una descripción detallada de su motivo de consulta.',
          sender_type: 'BOT',
        });
        ws.botState = STATES.AWAITING_DESCRIPTION;
        break;
      }
      case STATES.AWAITING_DESCRIPTION: {
        const description = data.message;
        ws.flowData = ws.flowData || {};
        ws.flowData.description = description;
        sendMessage(ws, {
          event: 'chatbot_message',
          message: `Resumen de su consulta:\n- Motivo: ${
            ws.flowData.consultReason || ''
          }\n- Descripción: ${description}\n¿Desea confirmar el agendamiento de su cita? (si/no)`,
          sender_type: 'BOT',
          list: true,
          options: ['si', 'no'],
        });
        ws.botState = STATES.CONFIRMATION;
        break;
      }
      case STATES.CONFIRMATION: {
        const confirmation = data.message.toLowerCase().trim();
        if (confirmation === 'si' || confirmation === 'sí') {
          const appointmentData = {
            user_id: ws.user.id,
            professional_id: ws.professionalId || null,
            specialty_id: ws.flowData.specialty_id || null,
            beneficiary_id: ws.flowData.beneficiary_id || null,
            appointment_date: new Date(),
            status: 'PENDING',
            notes: `Descripción: ${ws.flowData.description}`,
            is_for_beneficiary: ws.flowData.is_for_beneficiary || false,
          };

          try {
            const scheduled = await appointmentService.createAppointment(
              appointmentData
            );
            sendMessage(ws, {
              event: 'chatbot_message',
              message:
                'Su cita ha sido recibida. Nos pondremos en contacto una vez tengas disponibilidad. ¡Gracias por utilizar nuestro servicio!',
              sender_type: 'BOT',
              redirectUrl: '/home',
            });
          } catch (error) {
            console.error('Error al guardar la cita:', error);
            sendMessage(ws, {
              event: 'chatbot_message',
              message:
                'Ocurrió un error al guardar su cita. Por favor, intente nuevamente más tarde.',
              sender_type: 'BOT',
            });
          }
          ws.botState = STATES.COMPLETED;
        } else if (confirmation === 'no') {
          sendMessage(ws, {
            event: 'chatbot_message',
            message:
              'Entendido. Si necesita más ayuda, puede iniciar un nuevo flujo de consulta. ¡Gracias!',
            sender_type: 'BOT',
          });
          ws.botState = STATES.COMPLETED;
        } else {
          // Agregamos las opciones seleccionables "si" y "no"
          sendMessage(ws, {
            event: 'chatbot_message',
            message:
              'No he entendido su respuesta. Por favor, confirme si desea agendar la cita respondiendo "si" o "no".',
            sender_type: 'BOT',
            list: true,
            options: ['si', 'no'],
          });
        }
        break;
      }
      default: {
        sendMessage(ws, {
          event: 'chatbot_message',
          message:
            'Ha ocurrido un error en el flujo del chatbot. Reiniciando el proceso...',
          sender_type: 'BOT',
          shouldRestartFlow: true,
        });
        ws.botState = STATES.AWAITING_DOCUMENT;
        break;
      }
    }
  } catch (error) {
    console.error('Error en el flujo del chatbot:', error);
    sendMessage(ws, {
      event: 'chatbot_message',
      message: 'Error interno, por favor intente nuevamente más tarde.',
      sender_type: 'BOT',
    });
  }
}

module.exports = {
  handleChatbotFlow,
  STATES,
};
