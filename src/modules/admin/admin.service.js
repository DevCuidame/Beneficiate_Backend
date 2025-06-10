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

module.exports = {
    getAllUsers,
}