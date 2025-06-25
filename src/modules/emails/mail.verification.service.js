// src/modules/auth/work.verification.service.js
const transporter = require('../../utils/emailConf');
const workEmailTemplate = require('./templates/workEmailTemplate');
const WelcomeEmailTemplate = require('./templates/welcomeEmailTemplate');
const NewBeneficiaryEmailTemplate = require('./templates/newBeneficiaryEmailTemplate');
const PayConfirmationEmailTemplate = require('./templates/payConfirmationEmailTemplate');
const MeetingConfirmationEmailTemplate = require('./templates/meetingConfirmationEmailTemplate');

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
      to: beneficiaryForm.email,  // Aquí va la dirección a la que se enviará el correo
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

/**
 * Envía un correo notificando el interés de trabajar con nosotros
 * @param {String} payForm - Datos del médico interesado
 * @returns {Object} - Resultado de la operación
 */
const sendPayConfirmationEmail = async (payForm) => {
  // Enviar correo
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Remitente, tu correo
      to: payForm.emailTo,  // Aquí va la dirección a la que se enviará el correo
      subject: 'Confirmación de pago',  // Asunto
      html: PayConfirmationEmailTemplate(payForm),  // El contenido generado con el template
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
 * Envía un correo notificando la cita programada
 * @param {String} payForm - Datos del médico interesado
 * @returns {Object} - Resultado de la operación
 */
const sendMeetingConfirmationEmail = async (meetForm) => {
  // Enviar correo
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Remitente, tu correo
      to: meetForm.userData.email,  // Aquí va la dirección a la que se enviará el correo
      subject: 'Confirmación de cita.',  // Asunto
      html: MeetingConfirmationEmailTemplate(meetForm), 
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
  sendWelcomeEmail,
  sendPayConfirmationEmail,
  sendMeetingConfirmationEmail,
};
