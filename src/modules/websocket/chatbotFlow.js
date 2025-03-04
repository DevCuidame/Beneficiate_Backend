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
  const beneficiaries = await beneficiaryRepository.findByIdentification(document);

  if (user && user.identification_number === document) {
    const belongsTo = `${user.first_name.split(' ')[0]} ${user.last_name.split(' ')[0]}`;
    return { valid: true, belongsTo, type: 'user' };
  }

  if (beneficiaries && beneficiaries.length > 0) {
    const matchingBeneficiary = beneficiaries.find((b) => b.identification_number === document);
    if (matchingBeneficiary) {
      const belongsTo = `${matchingBeneficiary.first_name.split(' ')[0]} ${matchingBeneficiary.last_name.split(' ')[0]}`;
      return { valid: true, belongsTo, type: 'beneficiary' };
    }
  }

  return { valid: false, error: 'El documento no coincide con nuestros registros.' };
}

function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

async function handleChatbotFlow(ws, data) {
  try {
    // Si el mensaje es de inicialización, asignamos el professionalId
    if (data.event && data.event === 'init') {
      ws.professionalId = data.professionalId;
      console.log("Professional ID set to:", ws.professionalId);
      return;
    }

    // Log general de estado en cada paso
    console.log("Estado actual:", ws.botState, "ws.professionalId:", ws.professionalId, "ws.flowData:", ws.flowData);

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
        console.log("Lista de especialidades:", specialties); // Log para depuración
        let specialtiesList = specialties.length > 0
          ? specialties.map((specialty) => specialty.name).join(', ')
          : 'No hay especialidades disponibles';

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

        console.log("Especialidad seleccionada:", selectedSpecialtyName);
        console.log("Especialidad encontrada:", specialtyFound);

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
        console.log("ws.flowData después de asignar especialidad:", ws.flowData);

        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Gracias. Ahora, por favor, brinde una descripción detallada de su motivo de consulta.',
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
          message: 'Gracias. Ahora, por favor, brinde una descripción detallada de su motivo de consulta.',
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
          message: `Resumen de su consulta:\n- Motivo: ${ws.flowData.consultReason || ''}\n- Descripción: ${description}\n¿Desea confirmar el agendamiento de su cita? (si/no)`,
          sender_type: 'BOT',
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
            notes: `Motivo: ${ws.flowData.consultReason || ''}\nDescripción: ${ws.flowData.description}`,
            is_for_beneficiary: ws.flowData.is_for_beneficiary || false,
          };

          console.log("Datos de la cita a guardar:", appointmentData);

          try {
            const scheduled = await appointmentService.createAppointment(appointmentData);
            console.log('🚀 ~ handleChatbotFlow ~ scheduled:', scheduled);
            sendMessage(ws, {
              event: 'chatbot_message',
              message: 'Su cita ha sido recibida. Nos pondremos en contacto una vez tengas disponibilidad. ¡Gracias por utilizar nuestro servicio!',
              sender_type: 'BOT',
            });
          } catch (error) {
            console.error('Error al guardar la cita:', error);
            sendMessage(ws, {
              event: 'chatbot_message',
              message: 'Ocurrió un error al guardar su cita. Por favor, intente nuevamente más tarde.',
              sender_type: 'BOT',
            });
          }
          ws.botState = STATES.COMPLETED;
        } else if (confirmation === 'no') {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Entendido. Si necesita más ayuda, puede iniciar un nuevo flujo de consulta. ¡Gracias!',
            sender_type: 'BOT',
          });
          ws.botState = STATES.COMPLETED;
        } else {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'No he entendido su respuesta. Por favor, confirme si desea agendar la cita respondiendo "si" o "no".',
            sender_type: 'BOT',
          });
        }
        break;
      }
      default: {
        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Ha ocurrido un error en el flujo del chatbot. Reiniciando el proceso...',
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
