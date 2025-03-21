// src/modules/auth/work.verification.routes.js
const express = require('express');
const router = express.Router();
const {  
  sendWorkWithUsEmail 
} = require('./work.verification.controller');

router.post('/send-work', sendWorkWithUsEmail);

module.exports = router;