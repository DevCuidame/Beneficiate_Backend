// src/modules/auth/email.verification.controller.js
const workVerificationService = require('./mail.verification.service');
const { successResponse, errorResponse } = require('../../core/responses');

/**
 * Controlador para enviar correo de verificación (uso interno)
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const sendWorkWithUsEmail = async (req, res) => {
  try {    
    const doctorForm = req.body;
    const result = await workVerificationService.sendWorkWithUsEmail(doctorForm);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para enviar correo de Bienvenida
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const sendNewBeneficiaryEmail = async (req, res) => {
  try {    
    const beneficiaryForm = req.body;
    const result = await workVerificationService.sendNewBeneficiaryEmail(beneficiaryForm);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para enviar correo de Bienvenida
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const sendWelcomeEmail = async (req, res) => {
  try {    
    const emailTo = req.body.emailTo;
    const result = await workVerificationService.sendWelcomeEmail(emailTo);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para enviar correo de Bienvenida
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const sendPayConfirmationEmail = async (req, res) => {
  try {    
    const payForm = req.body;
    const result = await workVerificationService.sendPayConfirmationEmail(payForm);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  sendWorkWithUsEmail,
  sendNewBeneficiaryEmail,
  sendWelcomeEmail,
  sendPayConfirmationEmail
};