// src/modules/auth/work.verification.routes.js
const express = require('express');
const router = express.Router();
const {  
  sendWorkWithUsEmail,
  sendWelcomeEmail,
  sendNewBeneficiaryEmail
} = require('./mail.verification.controller');

router.post('/send-work', sendWorkWithUsEmail);
router.post('/new-beneficiary', sendNewBeneficiaryEmail);
router.post('/welcome', sendWelcomeEmail);

module.exports = router;