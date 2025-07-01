// src/modules/auth/password.reset.service.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { ValidationError, NotFoundError } = require("../../../core/errors");
const userRepository = require("../../users/user.repository");
const beneficiaryRepository = require("../../beneficiaries/beneficiary.repository");
const transporter = require("../../../utils/emailConf");
const resetPasswordTemplate = require("../../emails/templates/resetPasswordTemplate");

/**
 * Genera un token JWT para restablecer la contraseña
 * @param {Object} user - Datos del usuario
 * @returns {string} - Token JWT
 */
const generateResetToken = (user, isBeneficiary) => {
  return jwt.sign(
    { id: user.id, isBeneficiary: isBeneficiary, email: user.email, type: "password_reset" },
    process.env.JWT_VERIFICATION_SECRET,
    { expiresIn: "1h" }
  );
};

/**
 * Verifica la validez de un token de restablecimiento
 * @param {string} token - Token a verificar
 * @returns {Object} - Payload del token decodificado
 */
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_VERIFICATION_SECRET);

    // Verificar que el token sea del tipo correcto
    if (decoded.type !== "password_reset") {
      throw new ValidationError("Token de restablecimiento inválido");
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ValidationError("El enlace de restablecimiento ha expirado");
    }
    throw new ValidationError("Token de restablecimiento inválido");
  }
};

/**
 * Envía un correo con el enlace para restablecer la contraseña
 * @param {string} email - Correo del usuario
 * @returns {Object} - Resultado de la operación
 */
const requestPasswordReset = async (email) => {
  let user = await userRepository.findByEmail(email);
  let isBeneficiary = false;

  if (!user) {
    user = await beneficiaryRepository.findByEmail(email);
    if (!user) {
      return {
        success: true,
        message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      };
    }
    isBeneficiary = true;
  }

  // Generar token
  const resetToken = generateResetToken(user, isBeneficiary);

  // Guardar el token en la base de datos según el tipo
  if (isBeneficiary) {
    await beneficiaryRepository.saveResetToken(user.id, resetToken);
  } else {
    await userRepository.saveResetToken(user.id, resetToken);
  }

  // Construir enlace
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Enviar correo
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Recuperación de contraseña",
      html: resetPasswordTemplate(user.first_name, resetLink),
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
      message:
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
    };
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    throw new Error("No se pudo enviar el correo de recuperación");
  }
};

/**
 * Restablece la contraseña usando un token válido
 * @param {string} token - Token de restablecimiento
 * @param {string} newPassword - Nueva contraseña
 * @returns {Object} - Resultado de la operación
 */
const resetPassword = async (token, newPassword) => {
  // Verificar token
  let user;
  let isTokenValid;
  const decoded = verifyResetToken(token);

  // Verificar que el usuario exista
  if (!decoded.isBeneficiary) {
    user = await userRepository.getUserById(decoded.id);
  } else {
    user = await beneficiaryRepository.findById(decoded.id);
  }

  if (!user) {
    throw new NotFoundError("Usuario no encontrado");
  }

  if (!decoded.isBeneficiary) {
    isTokenValid = await userRepository.checkResetToken(user.id, token);
  } else {
    isTokenValid = await beneficiaryRepository.checkResetToken(user.id, token);
  }

  if (!isTokenValid) {
    throw new ValidationError("El enlace ya ha sido utilizado o no es válido");
  }

  // Validar la nueva contraseña
  if (!newPassword || newPassword.length < 8) {
    throw new ValidationError("La contraseña debe tener al menos 8 caracteres");
  }

  // Hashear la nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  if (!decoded.isBeneficiary) {
    await userRepository.updatePassword(user.id, hashedPassword);
    await userRepository.invalidateResetToken(user.id, token);
  } else {
        console.log(user.id);
    await beneficiaryRepository.updateBeneficiaryPassword(user.id, hashedPassword);
    await beneficiaryRepository.invalidateResetToken(user.id, token);
  }

  return {
    success: true,
    message: "Contraseña actualizada exitosamente",
  };
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
};
