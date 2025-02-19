// modules/auth/auth.routes.js
const express = require('express');
const router = express.Router();
const { login, register, refreshTokenController, verifyEmail } = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const { loginSchema, registerSchema } = require('./auth.validation');

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/refresh-token', refreshTokenController); 
router.get('/verify-email', verifyEmail);

module.exports = router;