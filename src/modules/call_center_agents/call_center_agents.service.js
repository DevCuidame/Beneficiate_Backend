const callCenterAgentRepository = require('./call_center_agents.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');

const getCallCenterAgentById = async (id) => {
  const agent = await callCenterAgentRepository.findCallCenterAgentById(id);
  if (!agent) {
    throw new NotFoundError('Agente de call center no encontrado');
  }
  return agent;
};

const getCallCenterAgentByUserId = async (userId) => {
  const agent = await callCenterAgentRepository.findCallCenterAgentByUserId(userId);
  if (!agent) {
    return null;
  }
  return agent;
};

const getAll = async () => {
  const agents = await callCenterAgentRepository.getAll();
  return agents || [];
};

const createCallCenterAgent = async (agentData) => {
  const existingAgent = await callCenterAgentRepository.findCallCenterAgentByUserId(agentData.user_id);
  if (existingAgent) {
    throw new ValidationError('El usuario ya tiene un agente de call center asignado.');
  }
  agentData.created_at = agentData.created_at || new Date();
  
  const newAgent = await callCenterAgentRepository.createCallCenterAgent(agentData);
  return { ...newAgent };
};

const updateCallCenterAgent = async (id, agentData) => {
  const agent = await callCenterAgentRepository.findCallCenterAgentById(id);
  if (!agent) {
    throw new NotFoundError('Agente de call center no encontrado');
  }
  const updatedAgent = await callCenterAgentRepository.updateCallCenterAgent(id, agentData);
  return { ...updatedAgent };
};

const deleteCallCenterAgent = async (id) => {
  const agent = await callCenterAgentRepository.findCallCenterAgentById(id);
  if (!agent) {
    throw new NotFoundError('Agente de call center no encontrado');
  }
  await callCenterAgentRepository.deleteCallCenterAgent(id);
  return { message: 'Agente de call center eliminado correctamente' };
};

module.exports = {
  getCallCenterAgentById,
  getCallCenterAgentByUserId,
  getAll,
  createCallCenterAgent,
  updateCallCenterAgent,
  deleteCallCenterAgent,
};
