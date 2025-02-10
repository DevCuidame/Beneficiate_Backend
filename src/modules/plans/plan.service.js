const planRepository = require('./plan.repository');
const { ValidationError } = require('../../core/errors');

const getAllPlans = async () => {
  return await planRepository.findAllPlans();
};

const getPlanById = async (plan_id) => {
  if (!plan_id) {
    throw new ValidationError('El ID del plan es obligatorio');
  }

  const plan = await planRepository.findPlanById(plan_id);
  if (!plan) {
    throw new ValidationError('No se encontró el plan');
  }

  return plan;
};

const createPlan = async (planData) => {
  return await planRepository.createPlan(planData);
};

const updatePlan = async (plan_id, planData) => {
  if (!plan_id) {
    throw new ValidationError('El ID del plan es obligatorio');
  }

  return await planRepository.updatePlan(plan_id, planData);
};

const deletePlan = async (plan_id) => {
  if (!plan_id) {
    throw new ValidationError('El ID del plan es obligatorio');
  }

  return await planRepository.deletePlan(plan_id);
};

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
