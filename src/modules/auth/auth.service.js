// modules/auth/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('../../utils/jwt');
const authRepository = require('./auth.repository');
const { UnauthorizedError, ValidationError } = require('../../core/errors');
const { buildImage } = require('../../utils/image.utils');
const path = require('path');
const imageRepository = require('../images/user/user.images.repository');
const PATHS = require('../../config/paths');
const emailVerificationService = require('./verification/email.verification.service');
const callCenterAgentService = require('../call_center_agents/call_center_agents.service');
const userService = require('../users/user.service');

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

const login = async (email, password) => {
  email = email.toLowerCase();

  const user = await authRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('Credenciales Inválidas');
  }

  // Verificar si el usuario ha verificado su correo
  // if (!user.verified) {
  //   throw new UnauthorizedError('Por favor verifica tu correo electrónico antes de iniciar sesión');
  // }

  let isAgent = false;
  let agentActive = false;
  try {
    const agent = await callCenterAgentService.getCallCenterAgentByUserId(
      user.id
    );
    if (agent) {
      isAgent = true;
      agentActive = false;
    }
  } catch (error) {
    isAgent = false;
    agentActive = false;
  }

  // Generar tokens
  const accessToken = jwt.generateAccessToken({
    id: user.id,
    email: user.email,
    isAgent: isAgent,
    agentActive: agentActive,
  });
  const refreshToken = jwt.generateRefreshToken({
    id: user.id,
    email: user.email,
  });

  // Guardar el refresh token en la BD
  await authRepository.saveRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
};

const refreshToken = async (token) => {
  const decoded = jwt.verifyToken(token, process.env.JWT_REFRESH_SECRET);
  if (!decoded) {
    throw new UnauthorizedError('Refresh Token inválido o expirado');
  }

  const validToken = await authRepository.findRefreshToken(decoded.id, token);
  if (!validToken) {
    throw new UnauthorizedError('Refresh Token no válido');
  }

  // Generar nuevo access token
  const newAccessToken = jwt.generateAccessToken({
    id: decoded.id,
    email: decoded.email,
  });

  return { accessToken: newAccessToken };
};

const register = async (userData) => {
  userData.email = userData.email.toLowerCase();
  const existingUser = await authRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new ValidationError('No logramos registrar tu email');
  }

  const existingIdentification = await authRepository.findByIdentification(
    userData.identification_number
  );
  if (existingIdentification) {
    throw new ValidationError(
      'No logramos registrar tu número de identificación'
    );
  }
  userData.verified = false;

  userData.password = await bcrypt.hash(userData.password, 10);
  const newUser = await authRepository.createUser(userData);

  // const verificationToken = jwt.generateVerificationToken(newUser);
  // await emailService.sendVerificationEmail(newUser, verificationToken);

  if (!newUser || !newUser.id) {
    throw new ValidationError('No logramos guardar tu imagen');
  }

  if (userData.base_64) {
    await processImage(newUser.id, userData.public_name, userData.base_64);
  }
  // Send verification email
  try {
    await emailVerificationService.sendVerificationEmail(newUser);
  } catch (error) {
    console.error('Error al enviar correo de verificación:', error.message);
    // No lanzamos error para no detener el registro
  }

  return newUser;
};

const verifyEmail = async (token) => {
  try {
    const decoded = jwt.verifyToken(token, process.env.JWT_VERIFICATION_SECRET);
    const user = await userRepository.findByEmail(decoded.email);

    if (!user) throw new ValidationError('Usuario no encontrado.');
    if (user.verified)
      throw new ValidationError('El correo ya ha sido verificado.');

    await authRepository.verifyUser(decoded.email);
    return { message: 'Correo verificado exitosamente.' };
  } catch (error) {
    throw new ValidationError('Token inválido o expirado.');
  }
};



const deleteAccount = async (userId, password) => {
  const user = await userService.getUser(userId);
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }

  if (!password || !user.password) {
    throw new ValidationError('Contraseña incorrecta o datos de usuario inválidos');
  }

  try {
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError('Contraseña incorrecta');
    }
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    throw new UnauthorizedError('Error al verificar credenciales');
  }

  await authRepository.deleteUserData(userId);
  
  const deleted = await authRepository.deleteUserAccount(userId);
  if (!deleted) {
    throw new Error('No se pudo eliminar la cuenta');
  }

  return { success: true };
};

module.exports = { login, register, refreshToken, verifyEmail, deleteAccount };
