const {
  twilioClient,
  TWILIO_WHATSAPP_NUMBER,
  TWILIO_SMS_NUMBER,
  TWILIO_MESSAGING_SERVICE_SID,
} = require('../../config/twilio.config');
const pool = require('../../config/connection');

class TwilioService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Normaliza un número de teléfono al formato internacional
   * @param {string} phoneNumber - Número de teléfono
   * @returns {string} - Número normalizado
   */
  normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;

    // Eliminar todos los caracteres no numéricos
    let normalized = phoneNumber.replace(/\D/g, '');

    // Asegurarse que comience con el código de país (default Colombia)
    if (normalized.length === 10) {
      normalized = '57' + normalized;
    } else if (normalized.length > 10 && !normalized.startsWith('57')) {
      normalized = '57' + normalized;
    }

    return normalized;
  }

  /**
   * Envía un mensaje de WhatsApp, soportando tanto mensajes de texto simples como plantillas.
   * @param {string} to - Número de teléfono del destinatario
   * @param {string|Object} message - Mensaje de texto o objeto de plantilla
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} - Resultado del envío
   */

  async sendWhatsAppMessage(to, message, options = {}) {
    const normalizedNumber = this.normalizePhoneNumber(to);

    if (!normalizedNumber) {
      console.warn('⚠️ Número de teléfono no válido. WhatsApp no enviado.');
      return {
        success: false,
        error: 'Número de teléfono no proporcionado o inválido.',
      };
    }

    try {
      const formattedTo = `whatsapp:+${normalizedNumber}`;
      let messageOptions = {
        from: TWILIO_WHATSAPP_NUMBER,
        to: formattedTo,
      };

      if (typeof message === 'object' && message.template) {
        const templateSids = {
          appointment_confirmation: 'HX269d1b223840809f9bfdf9a799dd349b', 
          appointment_cancellation: 'HX7dcddfb72ea3a705236902bf78d5c5b0', 
          appointment_rescheduled: 'HX05b96adfded6908089bc2aa61f3d9af8', 
          appointment_reminder: 'HX3865468f6c551637a849c18c80796a89', 
          appointment_new_request: 'HX82398b830a87a4b55dee8e722cad2b88',
          appointment_doctor_notification: 'HX32f53a6aab201d3f8ecbcce6acfec10a'
        };

        if (!templateSids[message.template]) {
          throw new Error(
            `No se encontró SID para la plantilla: ${message.template}`
          );
        }

        const contentVariables = {};
        if (message.components && message.components.length > 0) {
          message.components.forEach((component) => {
            if (component.parameters) {
              component.parameters.forEach((param, index) => {
                contentVariables[String(index + 1)] = param.text;
              });
            }
          });
        }

        messageOptions.contentSid = templateSids[message.template];
        messageOptions.contentVariables = JSON.stringify(contentVariables);
      } else {
        messageOptions.body = message;

        if (options.mediaUrl) {
          messageOptions.mediaUrl = options.mediaUrl;
        }
      }

      if (
        !messageOptions.body &&
        !messageOptions.mediaUrl &&
        !messageOptions.contentSid
      ) {
        throw new Error(
          'Se requiere un cuerpo de mensaje, URL de medios o SID de contenido'
        );
      }

      const response = await this.client.messages.create(messageOptions);

      console.log(`✅ WhatsApp enviado a ${formattedTo}`);

      let messageText =
        typeof message === 'object' ? `Template: ${message.template}` : message;

      await this.logMessageSent(
        normalizedNumber,
        'WHATSAPP',
        messageText,
        response.sid,
        response.status
      );

      return { success: true, sid: response.sid, status: response.status };
    } catch (error) {
      console.error('❌ Error enviando mensaje de WhatsApp:', error);

      // Registrar el error en la base de datos
      let messageText =
        typeof message === 'object' ? `Template: ${message.template}` : message;

      await this.logMessageError(
        normalizedNumber,
        'WHATSAPP',
        messageText,
        error.message
      );

      return { success: false, error: error.message, details: error };
    }
  }
  /**
   * Envía un mensaje de texto (SMS).
   */
  async sendSMS(to, message, options = {}) {
    const normalizedNumber = this.normalizePhoneNumber(to);

    if (!normalizedNumber) {
      console.warn('⚠️ Número de teléfono no válido. SMS no enviado.');
      return {
        success: false,
        error: 'Número de teléfono no proporcionado o inválido.',
      };
    }

    try {
      const messageOptions = {
        messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
        to: `+${normalizedNumber}`,
        body: message,
      };

      if (options.mediaUrl) {
        messageOptions.mediaUrl = options.mediaUrl;
      }

      const response = await this.client.messages.create(messageOptions);

      console.log(`✅ SMS enviado a +${normalizedNumber}: ${message}`);

      // Registrar el envío en la base de datos
      await this.logMessageSent(
        normalizedNumber,
        'SMS',
        message,
        response.sid,
        response.status
      );

      return { success: true, sid: response.sid, status: response.status };
    } catch (error) {
      console.error('❌ Error enviando SMS:', error);

      // Registrar el error en la base de datos
      await this.logMessageError(
        normalizedNumber,
        'SMS',
        message,
        error.message
      );

      return { success: false, error: error.message, details: error };
    }
  }

  /**
   * Registra un mensaje enviado en la base de datos
   */
  async logMessageSent(phoneNumber, channel, message, sid, status) {
    try {
      const query = `
        INSERT INTO message_logs (phone_number, channel, message, message_sid, status, sent_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;

      await pool.query(query, [phoneNumber, channel, message, sid, status]);
    } catch (dbError) {
      console.error('Error registrando mensaje en base de datos:', dbError);
    }
  }

  /**
   * Registra un error de envío en la base de datos
   */
  async logMessageError(phoneNumber, channel, message, error) {
    try {
      const query = `
        INSERT INTO message_logs (phone_number, channel, message, error, status, sent_at)
        VALUES ($1, $2, $3, $4, 'FAILED', NOW())
      `;

      await pool.query(query, [phoneNumber, channel, message, error]);
    } catch (dbError) {
      console.error(
        'Error registrando error de mensaje en base de datos:',
        dbError
      );
    }
  }

  /**
   * Envía mensajes según las preferencias del destinatario
   * @param {string} to - Número de teléfono del destinatario
   * @param {string} message - Mensaje a enviar
   * @param {Object} options - Opciones adicionales
   * @param {string} options.channel - Canal preferido ('SMS', 'WHATSAPP', 'BOTH')
   */
  async sendMessage(to, message, options = {}) {
    console.log(`🚀 Enviando mensajes a ${to}...`);

    const channel = options.channel || 'BOTH';

    if (channel === 'WHATSAPP' || channel === 'BOTH') {
      const whatsappResult = await this.sendWhatsAppMessage(
        to,
        message,
        options
      );

      // Si solo es WhatsApp o si WhatsApp tuvo éxito cuando el canal es BOTH
      if (channel === 'WHATSAPP' || whatsappResult.success) {
        return { whatsappResult };
      }
    }

    if (channel === 'SMS' || channel === 'BOTH') {
      const smsResult = await this.sendSMS(to, message, options);

      if (channel === 'BOTH') {
        return { whatsappResult: { success: false }, smsResult };
      }

      return { smsResult };
    }

    return { success: false, error: 'Canal no válido' };
  }

  /**
   * Verifica el estado de un mensaje enviado
   */
  async checkMessageStatus(messageSid) {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        dateSent: message.dateSent,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
      };
    } catch (error) {
      console.error('Error al verificar estado de mensaje:', error);
      return { error: error.message };
    }
  }
}

module.exports = new TwilioService(twilioClient);
