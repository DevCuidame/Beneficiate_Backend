const userService = require('./user.service');
const { successResponse, errorResponse } = require('../../core/responses');

/**
 * Controlador para buscar usuario por correo electrónico.
 */
const findByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await userService.findByEmail(email);
    successResponse(res, user, 'Usuario recuperado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para obtener usuario por ID.
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    successResponse(res, user, 'Usuario recuperado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para buscar usuario por número de identificación.
 */
const findByIdentification = async (req, res) => {
  try {
    const { identification_type, identification_number } = req.params;
    const user = await userService.findByIdentification(identification_type, identification_number);
    successResponse(res, user, 'Usuario encontrado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};


module.exports = {
  findByEmail,
  getUserById,
  findByIdentification,
};
