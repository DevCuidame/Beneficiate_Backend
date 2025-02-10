// modules/auth/auth.controller.js
const authService = require('./auth.service');
const userService = require('../users/user.service');
const beneficiaryService = require('../beneficiaries/beneficiary.service');
const { successResponse, errorResponse } = require('../../core/responses');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    
    if (!token) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const user = await userService.findByEmail(email);
    const beneficiaries = await beneficiaryService.getBeneficiariesByUser(user.id)

    successResponse(res, { token, user, beneficiaries }, 'Login exitoso');
  } catch (error) {
    console.log("🚀 ~ login ~ error:", error)
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
