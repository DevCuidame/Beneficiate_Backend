// src/modules/auth/password.reset.routes.js
const express = require('express');
const router = express.Router();
const { 
  requestPasswordReset, 
  verifyResetToken, 
  resetPassword 
} = require('./password.reset.controller');
const validate = require('../../../middlewares/validate.middleware');
const { 
  requestResetSchema, 
  verifyTokenSchema, 
  resetPasswordSchema 
} = require('./password.reset.validation');

// Solicitar restablecimiento de contraseña
router.post('/request-reset', validate(requestResetSchema), requestPasswordReset);

// Verificar token de restablecimiento
router.get('/verify-token/:token', verifyResetToken);

// Restablecer contraseña
router.post('/reset', validate(resetPasswordSchema), resetPassword);

module.exports = router;