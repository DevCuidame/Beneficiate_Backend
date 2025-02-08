// modules/auth/auth.controller.js
const authService = require('./auth.service');
const { successResponse, errorResponse } = require('../../core/responses');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    successResponse(res, { token }, 'Login successful');
  } catch (error) {
    errorResponse(res, error);
  }
};

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    successResponse(res, user, 'User registered successfully');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = { login, register };