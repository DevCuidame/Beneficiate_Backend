require('dotenv').config();
const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const TWILIO_SMS_NUMBER = process.env.TWILIO_SMS_NUMBER;
const TWILIO_MESSAGING_SERVICE_SID  = process.env.TWILIO_MESSAGING_SERVICE_SID;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER || !TWILIO_SMS_NUMBER) {
  console.error("❌ Error: Falta configuración de Twilio en el .env");
  process.exit(1);
}

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

module.exports = {
  twilioClient,
  TWILIO_WHATSAPP_NUMBER,
  TWILIO_SMS_NUMBER,
  TWILIO_MESSAGING_SERVICE_SID
};
