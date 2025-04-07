// modules/auth/auth.controller.js
const authService = require('./auth.service');
const userService = require('../users/user.service');
const callCenterAgentService = require('../call_center_agents/call_center_agents.service');
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
    const beneficiaries = await beneficiaryService.getBeneficiariesByUser(
      user.id
    );

    let isAgent = false;
    let agentActive = false;
    try {
      const agent = await callCenterAgentService.getCallCenterAgentByUserId(
        user.id
      );
      if (agent) {
        isAgent = true;
        agentActive = agent.status === 'ACTIVE';
        user.agentId = isAgent ? agent.id : null;
      }
    } catch (error) {
      isAgent = false;
      agentActive = false;
    }

    user.isAgent = isAgent;
    user.agentActive = agentActive;

    successResponse(res, { token, user, beneficiaries }, 'Login exitoso');
  } catch (error) {
    errorResponse(res, error);
  }
};

const refreshTokenController = async (req, res) => {
  try {
    x;
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

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const response = await authService.verifyEmail(token);
    successResponse(res, response, 'Correo verificado exitosamente.');
  } catch (error) {
    errorResponse(res, error);
  }
};


const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated request
    const { password } = req.body;


    if (!password) {
      throw new ValidationError('La contraseña es obligatoria para eliminar la cuenta');
    }

    const result = await authService.deleteAccount(userId, password);
    successResponse(res, result, 'Cuenta eliminada exitosamente');
  } catch (error) {
    console.error('Error during account deletion:', error);
    errorResponse(res, error);
  }
};

module.exports = { login, register, refreshTokenController, verifyEmail, deleteAccount };
