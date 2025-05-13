// modules/auth/auth.controller.js
const authService = require('./auth.service');
const userService = require('../users/user.service');
const callCenterAgentService = require('../call_center_agents/call_center_agents.service');
const beneficiaryService = require('../beneficiaries/beneficiary.service');
const { successResponse, errorResponse } = require('../../core/responses');
const { ValidationError } = require('../../core/errors');
const beneficiaryImageRepository = require('../images/beneficiary/beneficiary.images.repository');
const townshipRepository = require('../township/township.repository');
const beneficiaryRepository = require('../beneficiaries/beneficiary.repository');


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginResult = await authService.login(email, password);

    if (!loginResult) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    // Extraer el tipo de cuenta del resultado del login
    const { accountType, token } = loginResult;

    if (accountType === 'beneficiary') {
      // Si es un beneficiario, obtener información completa del beneficiario
      try {
        const beneficiary = await beneficiaryRepository.findByEmail(email);
        if (!beneficiary) {
          throw new NotFoundError('Beneficiario no encontrado');
        }
        
        // Eliminar password
        if (beneficiary.password) {
          delete beneficiary.password;
        }
        
        // Obtener datos adicionales
        const location = await townshipRepository.findLocationByTownshipId(beneficiary.city_id);
        const images = await beneficiaryImageRepository.getImagesByBeneficiary(beneficiary.id);
        const image = images && images.length > 0 ? images[0] : null;
        const healthData = await beneficiaryRepository.getBeneficiaryHealthData(beneficiary.id) || {
          distinctives: [],
          disabilities: [],
          allergies: [],
          diseases: [],
          family_history: [],
          medical_history: [],
          medications: [],
          vaccinations: []
        };
        
        // Crear objeto usuario enriquecido
        const enrichedBeneficiary = {
          ...beneficiary,
          location,
          image,
          ...healthData,
          isAgent: false,
          agentActive: false,
          accountType: 'beneficiary'
        };
        
        successResponse(res, { token, user: enrichedBeneficiary }, 'Login exitoso');
      } catch (error) {
        // Si hay un error, usar datos básicos
        const beneficiary = await beneficiaryRepository.findByEmail(email);
        if (beneficiary && beneficiary.password) {
          delete beneficiary.password;
        }
        successResponse(res, { token, user: beneficiary }, 'Login exitoso');
      }
    } else {
      // Si es un usuario, proceder como de costumbre
      try {
        const user = await userService.findByEmail(email);
        const beneficiaries = await beneficiaryService.getBeneficiariesByUser(
          user.id
        );

        // Eliminar password de beneficiarios
        if (beneficiaries && beneficiaries.length > 0) {
          beneficiaries.forEach(beneficiary => {
            if (beneficiary.password) {
              delete beneficiary.password;
            }
          });
        }

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
        user.accountType = 'user';

        successResponse(res, { token, user, beneficiaries }, 'Login exitoso');
      } catch (error) {
        // Si hay un error al buscar información adicional, usar información básica
        console.error('Error al obtener datos del usuario:', error);
        const user = await userRepository.findByEmail(email);
        if (user && user.password) {
          delete user.password;
        }
        successResponse(res, { token, user }, 'Login exitoso');
      }
    }
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
