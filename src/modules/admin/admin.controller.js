const { successResponse, errorResponse } = require('../../core/responses');

const useAdminService = require('./admin.service');

const getAllUsers = async (req, res) => {
    try {
        const users = await useAdminService.getAllUsers();
        successResponse(res, users, 'Usuarios obtenidos exitosamente');
    } catch (error) {
        errorResponse(res, error);
    }
}

module.exports = {  
    getAllUsers,
};