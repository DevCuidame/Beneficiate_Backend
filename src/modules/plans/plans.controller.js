const { successResponse, errorResponse } = require('../../core/responses');
const planService = require('./plan.service');

const getAllPlans = async (req, res) => { 
  try {
    const plans = await planService.getAllPlans();
    successResponse(res, plans, 'Planes recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  getAllPlans,
};
