// src/modules/auth/email.verification.service.js
const jwt = require('jsonwebtoken');
const { ValidationError, NotFoundError } = require('../../../core/errors');
const userRepository = require('../../users/user.repository');
const transporter = require('../../../utils/emailConf');
const verifyEmailTemplate = require('../../emails/templates/verifyEmailTemplate');

/**
 * Genera un token JWT para verificación de correo electrónico
 * @param {Object} user - Datos del usuario
 * @returns {string} - Token JWT
 */
const generateVerificationToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, type: 'email_verification' },
    process.env.JWT_VERIFICATION_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Verifica la validez de un token de verificación de correo
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload del token decodificado
 */
const verifyEmailToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);
    
    // Verificar que el token sea del tipo correcto
    if (decoded.type !== 'email_verification') {
      throw new ValidationError('Token de verificación inválido');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ValidationError('El enlace de verificación ha expirado');
    }
    throw new ValidationError('Token de verificación inválido');
  }
};

/**
 * Envía un correo con el enlace para verificar la dirección de correo
 * @param {Object} user - Datos del usuario
 * @returns {Object} - Resultado de la operación
 */
const sendVerificationEmail = async (user) => {
  // Generar token
  const verificationToken = generateVerificationToken(user);
  
  // Guardar el token en la base de datos
  await userRepository.saveVerificationToken(user.id, verificationToken);
  
  // Construir enlace
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  // Enviar correo
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verificación de Correo Electrónico',
      html: verifyEmailTemplate(user.first_name, verificationLink),
    };

    await transporter.sendMail(mailOptions);
    
    return { 
      success: true, 
      message: 'Se ha enviado un correo de verificación. Por favor revisa tu bandeja de entrada.' 
    };
  } catch (error) {
    console.error('Error al enviar correo de verificación:', error);
    throw new Error('No se pudo enviar el correo de verificación');
  }
};

/**
 * Verifica la dirección de correo electrónico usando un token válido
 * @param {string} token - Token de verificación
 * @returns {Object} - Resultado de la operación
 */
const verifyEmail = async (token) => {
  // Verificar token
  const decoded = verifyEmailToken(token);
  
  // Verificar que el usuario exista
  const user = await userRepository.getUserById(decoded.id);
  
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }
  
  // Verificar si el usuario ya está verificado
  if (user.verified) {
    return { 
      success: true, 
      message: 'Tu correo electrónico ya ha sido verificado anteriormente' 
    };
  }
  
  // Verificar si el token está en la lista de tokens válidos del usuario
  const isTokenValid = await userRepository.checkVerificationToken(user.id, token);
  
  if (!isTokenValid) {
    throw new ValidationError('El enlace ya ha sido utilizado o no es válido');
  }
  
  // Marcar al usuario como verificado
  await userRepository.verifyUser(user.id);
  
  // Invalidar el token usado
  await userRepository.invalidateVerificationToken(user.id, token);
  
  return { 
    success: true, 
    message: 'Tu correo electrónico ha sido verificado exitosamente' 
  };
};

/**
 * Reenvía un correo de verificación a un usuario
 * @param {string} email - Correo electrónico del usuario
 * @returns {Object} - Resultado de la operación
 */
const resendVerificationEmail = async (email) => {
  // Buscar el usuario por email
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    // Por seguridad, no revelar si el correo existe o no
    return { 
      success: true, 
      message: 'Si el correo está registrado, recibirás un enlace de verificación.' 
    };
  }
  
  // Verificar si el usuario ya está verificado
  if (user.verified) {
    return { 
      success: true, 
      message: 'Si el correo está registrado, recibirás un enlace de verificación.' 
    };
  }
  
  // Enviar correo de verificación
  await sendVerificationEmail(user);
  
  return { 
    success: true, 
    message: 'Si el correo está registrado, recibirás un enlace de verificación.' 
  };
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail
};