// src/modules/agent_chat/agent_chat.middleware.js
const callCenterAgentService = require('../modules/call_center_agents/call_center_agents.service');
const { UnauthorizedError } = require('../core/errors');

/**
 * Middleware para verificar si el usuario es un agente activo
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 * @param {Function} next - Siguiente middleware
 */
const isAgent = async (req, res, next) => {
  try {
    // Verificar si el usuario está autenticado
    if (!req.user || !req.user.id) {
      return next(new UnauthorizedError('Usuario no autenticado'));
    }

    // El ID del usuario desde el token JWT
    const userId = req.user.id;

    try {
      // Verificar si el usuario es un agente
      const agent = await callCenterAgentService.getCallCenterAgentByUserId(userId);
      
      if (!agent) {
        return next(new UnauthorizedError('El usuario no es un agente'));
      }
      
      if (agent.status !== 'ACTIVE') {
        return next(new UnauthorizedError('El agente no está activo'));
      }
      
      // Agregar la información del agente al objeto req para uso posterior
      req.agent = agent;
      next();
    } catch (agentError) {
      // Si ocurre un error al buscar al agente, se asume que no es un agente
      return next(new UnauthorizedError('No se pudo verificar el estatus de agente'));
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isAgent
};