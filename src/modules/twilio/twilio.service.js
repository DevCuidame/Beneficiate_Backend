const { twilioClient, TWILIO_WHATSAPP_NUMBER, TWILIO_SMS_NUMBER, TWILIO_MESSAGING_SERVICE_SID } = require('../../config/twilio.config');

class TwilioService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Envía un mensaje de WhatsApp.
   */
  async sendWhatsAppMessage(to, message) {
    if (!to) {
      console.warn("⚠️ Número de teléfono no válido. WhatsApp no enviado.");
      return { success: false, error: "Número de teléfono no proporcionado." };
    }

    try {
      const formattedTo = `whatsapp:+${to.replace(/\D/g, '')}`;

      const response = await this.client.messages.create({
        from: TWILIO_WHATSAPP_NUMBER,
        to: formattedTo,
        body: message,
      });

      console.log(`✅ WhatsApp enviado a ${formattedTo}: ${message}`);
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error('❌ Error enviando mensaje de WhatsApp:', error);
      return { success: false, error: error.message, details: error };
    }
  }

  /**
   * Envía un mensaje de texto (SMS).
   */
  async sendSMS(to, message) {
    try {
      const response = await twilioClient.messages.create({
        messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID,
        to: `+57${to.replace(/\D/g, '')}`,
        body: message,
      });

      console.log(`✅ SMS enviado a +${to}: ${message}`);
      return { success: true, sid: response.sid };
    } catch (error) {
      console.error('❌ Error enviando SMS:', error);
      return { success: false, error: error.message, details: error };
    }
  }

  /**
   * Envía mensajes de WhatsApp y SMS simultáneamente.
   */
  async sendMessage(to, message) {
    console.log(`🚀 Enviando mensajes a ${to}...`);

    const whatsappResult = await this.sendWhatsAppMessage(to, message);
    const smsResult = await this.sendSMS(to, message);

    return { whatsappResult, smsResult };
  }
}

module.exports = new TwilioService(twilioClient);
