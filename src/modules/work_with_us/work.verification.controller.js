// src/modules/auth/email.verification.controller.js
const workVerificationService = require('./work.verification.service');
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

module.exports = {
  sendWorkWithUsEmail
};