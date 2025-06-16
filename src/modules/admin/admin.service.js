const useAdminRepository = require('./admin.repository');

const getAllUsers = async ( ) => {
    try {
        const users = await useAdminRepository.findAllUsers();
        return users;
    }
    catch (error) {
        throw new Error('Error al obtener los usuarios: ' + error.message);
    }
}

const getAllPlans = async () => {
    try {
        const Plan = await useAdminRepository.findAllPlans();
        return Plan;
    }
    catch (error) {
        throw new Error('Error al crear el plan: ' + error.message);
    }
}

const createPlan = async (planData) => {
    try {
        planData.code = `${planData.name.toUpperCase()}-UNIQUE-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

        console.log('planData', planData);

        const Plan = await useAdminRepository.createPlan(planData);
        return Plan;
    }
    catch (error) {
        throw new Error('Error al crear el plan: ' + error.message);
    }
}

module.exports = {
    getAllUsers,
    getAllPlans,
    createPlan,
}