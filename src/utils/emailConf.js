const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'webmail.beneficiate.co', 
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false 
  },
  debug: true 
});

const sendServerStartupEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: `"Beneficiate Server" <${process.env.EMAIL_USER}>`,
      to: "alopez@cuidame.tech",
      subject: "Verificación: Servidor Iniciado",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4CAF50;">¡Servidor Iniciado Correctamente!</h2>
          <p>Este es un mensaje automático para confirmar que el servidor de Beneficiate se ha iniciado correctamente.</p>
          <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Entorno:</strong> ${process.env.NODE_ENV || 'desarrollo'}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #757575;">Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
      `
    });
    
    console.log('Correo de verificación enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar el correo de verificación:', error);
    return false;
  }
};

// sendServerStartupEmail();

const testConnection = async () => {
  try {
    await transporter.verify();
    console.log('Conexión exitosa al servidor de correo');
  } catch (error) {
    console.error('Error al conectar con el servidor de correo:', error);
  }
};

module.exports = transporter;