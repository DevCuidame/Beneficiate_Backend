const TwilioService = require('./twilio.service');

async function testTwilio() {
  console.log('🔍 Probando envío de mensajes de WhatsApp y SMS...');

  const testNumber = '+573194843592'; // Reemplázalo con un número válido

  const result = await TwilioService.sendMessage(testNumber, '📢 ¡Tu cita ha sido confirmada!');
  console.log(`📌 Resultados:`, result);
}



module.exports = testTwilio;