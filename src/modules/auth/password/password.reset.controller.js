// src/modules/auth/password.reset.controller.js
const passwordResetService = require('./password.reset.service');
const { successResponse, errorResponse } = require('../../../core/responses');

/**
 * Controlador para solicitar recuperación de contraseña
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return errorResponse(res, { message: 'El correo electrónico es requerido', statusCode: 400 });
    }
    
    const result = await passwordResetService.requestPasswordReset(email);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para verificar token de restablecimiento
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return errorResponse(res, { message: 'Token no proporcionado', statusCode: 400 });
    }
    
    const decoded = passwordResetService.verifyResetToken(token);
    successResponse(res, { valid: true, email: decoded.email }, 'Token válido');
  } catch (error) {
    errorResponse(res, { message: error.message, statusCode: 400 });
  }
};

/**
 * Controlador para restablecer contraseña
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token) {
      return errorResponse(res, { message: 'Token no proporcionado', statusCode: 400 });
    }
    
    if (!newPassword) {
      return errorResponse(res, { message: 'Nueva contraseña no proporcionada', statusCode: 400 });
    }
    
    const result = await passwordResetService.resetPassword(token, newPassword);
    successResponse(res, result, result.message);
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};