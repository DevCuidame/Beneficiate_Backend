// src/modules/auth/work.verification.service.js
const transporter = require('../../utils/emailConf');
const workEmailTemplate = require('./templates/workEmailTemplate');
const WelcomeEmailTemplate = require('./templates/welcomeEmailTemplate');
const NewBeneficiaryEmailTemplate = require('./templates/newBeneficiaryEmailTemplate');

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

/**
 * Envía un correo notificando el interés de trabajar con nosotros
 * @param {Object} beneficiaryForm - Datos del médico interesado
 * @returns {Object} - Resultado de la operación
 */
const sendNewBeneficiaryEmail = async (beneficiaryForm) => {

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Remitente, tu correo
      to: beneficiaryForm.beneficiary.email,  // Aquí va la dirección a la que se enviará el correo
      subject: 'Bienvenido a Beneficiate',  // Asunto
      html: NewBeneficiaryEmailTemplate(beneficiaryForm),  // El contenido generado con el template
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

/**
 * Envía un correo notificando el interés de trabajar con nosotros
 * @param {String} emailTo - Datos del médico interesado
 * @returns {Object} - Resultado de la operación
 */
const sendWelcomeEmail = async (emailTo) => {
  // Enviar correo
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Remitente, tu correo
      to: emailTo,  // Aquí va la dirección a la que se enviará el correo
      subject: 'Bienvenido a Beneficiate',  // Asunto
      html: WelcomeEmailTemplate(),  // El contenido generado con el template
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
  sendNewBeneficiaryEmail,
  sendWelcomeEmail
};
