const userRepository = require('./user.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');
const { successResponse, errorResponse } = require('../../core/responses');
const { buildImage } = require('../../utils/image.utils');
const path = require('path');
const imageRepository = require('../images/user/user.images.repository');
const PATHS = require('../../config/paths');

const processImage = async (id, publicName, base64) => {
  const { nanoid } = await import('nanoid');

  if (!base64 || !publicName) return null;

  const extension = publicName.substring(publicName.lastIndexOf('.'));
  const privateName = `USER_${nanoid(20)}${extension}`;
  const imagePath = path.join(PATHS.USER_IMAGES, privateName);

  try {
    await buildImage(privateName, 'user', base64);
    const imageData = {
      user_id: id,
      public_name: publicName,
      private_name: privateName,
      image_path: imagePath,
    };
    return await imageRepository.saveImage(imageData);
  } catch (error) {
    throw new ValidationError('Error al guardar la imagen: ' + error.message);
  }
};


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



const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    const existingUser = await userRepository.getUserById(id);
    if (!existingUser) {
      throw new NotFoundError('Usuario no encontrado');
    }

    if (userData.email && userData.email !== existingUser.email) {
      const userWithEmail = await userRepository.findByEmail(userData.email);
      if (userWithEmail && userWithEmail.id !== parseInt(id)) {
        throw new ValidationError('El correo electrónico ya está en uso');
      }
    }

    // Verificar si se está intentando actualizar la identificación a una ya existente
    if (userData.identification_number && userData.identification_number !== existingUser.identification_number) {
      const userWithIdentification = await userRepository.findByIdentification(userData.identification_number);
      if (userWithIdentification && userWithIdentification.id !== parseInt(id)) {
        throw new ValidationError('El número de identificación ya está en uso');
      }
    }

    // Realizar la actualización
    const updatedUser = await userRepository.updateUser(id, userData);

    // Procesar imagen si se proporciona
    if (userData.base_64 && userData.public_name) {
      await processImage(id, userData.public_name, userData.base_64);
    }

    // Obtener datos adicionales si es necesario
    const images = await imageRepository.getImagesByUser(id);
    const image = images.length > 0 ? images[0] : null;

    // Retornar respuesta
    successResponse(res, { ...updatedUser, image }, 'Usuario actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};


module.exports = {
  findByEmail,
  getUserById,
  findByIdentification,
  updateUser
};
