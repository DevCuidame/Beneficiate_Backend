// modules/auth/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('../../utils/jwt');
const authRepository = require('./auth.repository');
const { UnauthorizedError, ValidationError } = require('../../core/errors');
const { buildImage } = require('../../utils/image.utils');
const path = require('path');
const imageRepository = require('../images/user/user.images.repository');
const PATHS = require('../../config/paths');

const processImage = async (id, publicName, base64) => {
  const { nanoid } = await import('nanoid');

  if (!base64 || !publicName) return null;

  const privateName = `USER_${nanoid(20)}`;
  const imagePath = path.join(PATHS.PROFILE_IMAGES, privateName);

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

const login = async (email, password) => {
  const user = await authRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('Credenciales Inválidas');
  }
  return jwt.generateToken({ id: user.id, email: user.email });
};

const register = async (userData) => {
  const existingUser = await authRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new ValidationError('No logramos registrar tu email');
  }

  const existingIdentification = await authRepository.findByIdentification(
    userData.identification
  );
  if (existingIdentification) {
    throw new ValidationError(
      'No logramos registrar tu número de identificación'
    );
  }
  userData.verified = false;
  userData.plan_id = 1;

  userData.password = await bcrypt.hash(userData.password, 10);
  const newUser = authRepository.createUser(userData);

  // Procesar imagen si viene en base64
  if (userData.base_64) {
    await processImage(newUser.id, userData.public_name, userData.base_64);
  }

  return newUser;
};

module.exports = { login, register };
