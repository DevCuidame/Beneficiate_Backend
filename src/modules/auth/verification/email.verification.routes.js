// src/modules/auth/email.verification.routes.js
const express = require('express');
const router = express.Router();
const { 
  verifyEmail, 
  resendVerificationEmail 
} = require('./email.verification.controller');
const validate = require('../../../middlewares/validate.middleware');
const { 
  resendVerificationSchema 
} = require('./email.verification.validation');

router.get('/verify/:token', verifyEmail);

router.post('/resend', validate(resendVerificationSchema), resendVerificationEmail);

module.exports = router;