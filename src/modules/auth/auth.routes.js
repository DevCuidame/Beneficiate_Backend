// modules/auth/auth.routes.js
const express = require('express');
const router = express.Router();
const {
  login,
  register,
  refreshTokenController,
  verifyEmail,
  deleteAccount,
} = require('./auth.controller');
const validate = require('../../middlewares/validate.middleware');
const {
  loginSchema,
  registerSchema,
  deleteAccountSchema,
} = require('./auth.validation');

const authenticate = require('../../middlewares/auth.middleware');


router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.post('/refresh-token', refreshTokenController);
router.get('/verify-email', verifyEmail);
router.delete('/delete-account', authenticate, validate(deleteAccountSchema), deleteAccount);

module.exports = router;
