// src/modules/auth/password.reset.validation.js
const Joi = require('joi');

const requestResetSchema = Joi.object({
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

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "El token es obligatorio",
    "string.empty": "El token no puede estar vacío"
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.min": "La nueva contraseña debe tener al menos 8 caracteres",
    "any.required": "La nueva contraseña es obligatoria",
    "string.empty": "La nueva contraseña no puede estar vacía"
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    "any.only": "Las contraseñas no coinciden",
    "any.required": "La confirmación de contraseña es obligatoria",
    "string.empty": "La confirmación de contraseña no puede estar vacía"
  })
});

module.exports = {
  requestResetSchema,
  verifyTokenSchema,
  resetPasswordSchema
};