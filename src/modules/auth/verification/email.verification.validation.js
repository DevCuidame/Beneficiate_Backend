// src/modules/auth/email.verification.validation.js
const Joi = require('joi');

const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "El correo debe ser válido",
    "any.required": "El correo es obligatorio",
    "string.empty": "El correo no puede estar vacío"
  })
});

const verifyTokenSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "El token es obligatorio",
    "string.empty": "El token no puede estar vacío"
  })
});

module.exports = {
  resendVerificationSchema,
  verifyTokenSchema
};