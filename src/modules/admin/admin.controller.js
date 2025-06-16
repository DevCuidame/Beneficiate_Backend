const { successResponse, errorResponse } = require('../../core/responses');

const useAdminService = require('./admin.service');

const useAdminController = {
    getAllUsers: async (req, res) => {
        try {
            const users = await useAdminService.getAllUsers();
            successResponse(res, users, 'Usuarios obtenidos exitosamente');
        } catch (error) {
            errorResponse(res, error);
        }
    },

    getAllPlans: async (req, res) => {
        try {
            const plans = await useAdminService.getAllPlans();
            successResponse(res, plans, 'Planes obtenidos exitosamente');
        } catch (error) {
            errorResponse(res, error);
        }
    },

    createPlan: async (req, res) => {
        try {
            const planData = req.body;
            const plans = await useAdminService.createPlan(planData);
            successResponse(res, plans, 'Plan creado exitosamente');
        } catch (error) {
            errorResponse(res, error);
        }
    }
}

module.exports = useAdminController;