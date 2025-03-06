require('dotenv').config();
const TwilioService = require('./twilio.service');

async function testTwilio() {
  console.log('🔍 Probando envío de mensajes...');

  const testNumber = process.env.TEST_PHONE_NUMBER || '';
  if (!testNumber) {
    console.error('❌ Error: Defina TEST_PHONE_NUMBER en el archivo .env');
    return;
  }

  console.log('Enviando WhatsApp...');
  const whatsappResult = await TwilioService.sendWhatsAppMessage(
    testNumber, 
    '📢 ¡Prueba de WhatsApp! Esta es una prueba automatizada.'
  );
  console.log(`WhatsApp resultado:`, whatsappResult);

  console.log('Enviando SMS...');
  const smsResult = await TwilioService.sendSMS(
    testNumber, 
    '📢 Prueba de SMS: Esta es una prueba automatizada.'
  );
  console.log(`SMS resultado:`, smsResult);

  console.log('Enviando con preferencia combinada...');
  const combinedResult = await TwilioService.sendMessage(
    testNumber, 
    '📢 ¡Prueba combinada! Este mensaje usa ambos canales.',
    { channel: 'BOTH' }
  );
  console.log(`Resultado combinado:`, combinedResult);
}

// Ejecutar el test si este script se llama directamente
if (require.main === module) {
  testTwilio()
    .then(() => console.log('✅ Pruebas completadas'))
    .catch(err => console.error('❌ Error en las pruebas:', err))
    .finally(() => process.exit());
}

module.exports = testTwilio;