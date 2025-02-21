
const userRepository = require('../users/user.repository');
const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');

const STATES = {
  AWAITING_DOCUMENT: 'awaiting_document',
  AWAITING_CONSULT_REASON: 'awaiting_consult_reason',
  AWAITING_DESCRIPTION: 'awaiting_description',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed'
};


// TIPO DE SERVICIOS LISTAR
// Agregar la información del médico.

async function validateDocument(document, userId) {
  if (!document || document.length < 6) {
    return { valid: false, error: 'Documento inválido o incompleto.' };
  }

  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new Error('Parece que el documento no pertenece a un usuario.');
  }

  const beneficiary = await beneficiaryRepository.getBeneficiaryByUserId(userId);
  if (!beneficiary) {
    throw new Error('Parece que el documento no pertenece a uno de tus beneficiarios.');
  }

  let belongsTo = '';
  if (user.identification_number === document) {
    belongsTo = user.first_name.split(' ')[0] + ' ' + user.last_name.split(' ')[0];
  } else if (beneficiary.identification_number === document) {
    belongsTo = beneficiary.first_name.split(' ')[0] + ' ' + beneficiary.last_name.split(' ')[0];
  } else {
    return { valid: false, error: 'El documento no coincide con nuestros registros.' };
  }

  return { valid: true, belongsTo };
}


/**
 * Helper para enviar mensajes por el WebSocket.
 */
function sendMessage(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

async function handleChatbotFlow(ws, data) {
  try {
    switch(ws.botState) {
      case STATES.AWAITING_DOCUMENT: {
        const document = data.message;
        const validationResult = await validateDocument(document, ws.user.id);
        if (!validationResult.valid) {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Documento inválido, por favor intente nuevamente.',
            sender_type: 'BOT'
          });
          return; 
        }
        sendMessage(ws, {
          event: 'chatbot_message',
          message: `Documento validado como ${validationResult.belongsTo}. Por favor, ingrese el motivo de su consulta.`,
          sender_type: 'BOT'
        });
        ws.botState = STATES.AWAITING_CONSULT_REASON;
        break;
      }

      case STATES.AWAITING_CONSULT_REASON: {
        const consultReason = data.message;
        ws.flowData = ws.flowData || {};
        ws.flowData.consultReason = consultReason;
        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Gracias. Ahora, por favor, brinde una descripción detallada de su motivo de consulta.',
          sender_type: 'BOT'
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
          message: `Resumen de su consulta:\n- Motivo: ${ws.flowData.consultReason}\n- Descripción: ${description}\n¿Desea confirmar el agendamiento de su cita? (si/no)`,
          sender_type: 'BOT'
        });
        ws.botState = STATES.CONFIRMATION;
        break;
      }
      case STATES.CONFIRMATION: {
        const confirmation = data.message.toLowerCase().trim();
        if (confirmation === 'si' || confirmation === 'sí') {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Su cita ha sido recibida. Nos pondremos en contacto una vez tengas disponibilidad. ¡Gracias por utilizar nuestro servicio!',
            sender_type: 'BOT'
          });
          ws.botState = STATES.COMPLETED;
        } else if (confirmation === 'no') {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'Entendido. Si necesita más ayuda, puede iniciar un nuevo flujo de consulta. ¡Gracias!',
            sender_type: 'BOT'
          });
          ws.botState = STATES.COMPLETED;
        } else {
          sendMessage(ws, {
            event: 'chatbot_message',
            message: 'No he entendido su respuesta. Por favor, confirme si desea agendar la cita respondiendo "si" o "no".',
            sender_type: 'BOT'
          });
        }
        break;
      }
      default: {
        sendMessage(ws, {
          event: 'chatbot_message',
          message: 'Ha ocurrido un error en el flujo del chatbot. Reiniciando el proceso...',
          sender_type: 'BOT'
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
      sender_type: 'BOT'
    });
  }
}

module.exports = {
  handleChatbotFlow,
  STATES
};
