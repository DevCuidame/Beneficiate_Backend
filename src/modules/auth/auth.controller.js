// modules/auth/auth.controller.js
const authService = require('./auth.service');
const userService = require('../users/user.service');
const servicesService = require('../services/services.service');
const beneficiaryService = require('../beneficiaries/beneficiary.service');
const { successResponse, errorResponse } = require('../../core/responses');
const { ValidationError } = require('../../core/errors');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);
    
    if (!token) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const user = await userService.findByEmail(email);
    const beneficiaries = await beneficiaryService.getBeneficiariesByUser(user.id)
    const services = await servicesService.getAllServices();

    successResponse(res, { token, user, beneficiaries, services }, 'Login exitoso');
  } catch (error) {
    errorResponse(res, error);
  }
};

const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ValidationError('Refresh Token es obligatorio');
    }

    const newToken = await authService.refreshToken(refreshToken);
    successResponse(res, newToken, 'Token renovado exitosamente');
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

module.exports = { login, register, refreshTokenController };
