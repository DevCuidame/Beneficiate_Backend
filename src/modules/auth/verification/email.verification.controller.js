// src/modules/auth/email.verification.controller.js
const emailVerificationService = require('./email.verification.service');
const { successResponse, errorResponse } = require('../../../core/responses');

/**
 * Controlador para verificar correo electrónico
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return errorResponse(res, { message: 'Token no proporcionado', statusCode: 400 });
    }
    
    const result = await emailVerificationService.verifyEmail(token);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para reenviar correo de verificación
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return errorResponse(res, { message: 'El correo electrónico es requerido', statusCode: 400 });
    }
    
    const result = await emailVerificationService.resendVerificationEmail(email);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para enviar correo de verificación (uso interno)
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const sendVerificationEmail = async (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user || !user.id || !user.email) {
      return errorResponse(res, { message: 'Datos de usuario incompletos', statusCode: 400 });
    }
    
    const result = await emailVerificationService.sendVerificationEmail(user);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  verifyEmail,
  resendVerificationEmail,
  sendVerificationEmail
};