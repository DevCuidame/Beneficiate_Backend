// src/modules/auth/work.verification.service.js
const transporter = require('../../utils/emailConf');
const workEmailTemplate = require('../emails/workEmailTemplate');

/**
 * Envía un correo notificando el interés de trabajar con nosotros
 * @param {Object} doctorForm - Datos del médico interesado
 * @returns {Object} - Resultado de la operación
 */
const sendWorkWithUsEmail = async (doctorForm) => {

  // Enviar correo
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Remitente, tu correo
      to: process.env.EMAIL_WORK_WITH_US,  // Aquí va la dirección a la que se enviará el correo
      subject: 'Interés en Trabajar con Nosotros',  // Asunto
      html: workEmailTemplate(doctorForm),  // El contenido generado con el template
    };

    await transporter.sendMail(mailOptions);
    
    return { 
      success: true, 
      message: 'Se ha enviado el correo.' 
    };
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error('No se pudo enviar el correo de interés');
  }
};

module.exports = {
  sendWorkWithUsEmail,
};
