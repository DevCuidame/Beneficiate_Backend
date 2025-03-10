const pool = require('../../config/connection');
const { formatDatesInData } = require('../../utils/date.util');

const findByIdentification = async (identification_number) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE identification_number = $1',
    [identification_number]
  );
  return result.rows[0];
};

const findByTypeIdentification = async (
  identification_type,
  identification_number
) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE identification_type = $1 AND identification_number = $2',
    [identification_type, identification_number]
  );

  return result.rows[0];
};

const getUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const getUserByIdNum = async (id) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE identification_number = $1',
    [id]
  );
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT 
      id, first_name, last_name, identification_type, identification_number, 
      address, city_id, phone, gender, birth_date, email, verified, created_at, plan_id
     FROM users 
     WHERE email = $1;`,
    [email]
  );

  return formatDatesInData(result.rows[0] || null, [
    'birth_date',
    'created_at',
  ]);
};

const updateUserStatus = async (user_id, isOnline) => {
  await pool.query('UPDATE users SET online_status = $1 WHERE id = $2', [
    isOnline,
    user_id,
  ]);
};

const updateUserPlan = async (userId, planId) => {
  try {
    const result = await pool.query(
      'UPDATE users SET plan_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [planId, userId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error actualizando plan de usuario:', error);
    throw error;
  }
};

const getUserPaymentHistory = async (userId) => {
  const result = await pool.query(
    `SELECT 
      id, 
      transaction_id, 
      plan_id, 
      amount, 
      status, 
      created_at 
    FROM user_payments 
    WHERE user_id = $1 
    ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Guarda un token de restablecimiento para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} token - Token de restablecimiento
 * @returns {Promise<void>}
 */
const saveResetToken = async (userId, token) => {
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, created_at, expires_at)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour')
     ON CONFLICT (user_id) 
     DO UPDATE SET token = $2, created_at = NOW(), expires_at = NOW() + INTERVAL '1 hour', used = FALSE`,
    [userId, token]
  );
};

/**
 * Verifica si un token de restablecimiento es válido
 * @param {number} userId - ID del usuario
 * @param {string} token - Token a verificar
 * @returns {Promise<boolean>} - True si el token es válido
 */
const checkResetToken = async (userId, token) => {
  const result = await pool.query(
    `SELECT * FROM password_reset_tokens 
     WHERE user_id = $1 AND token = $2 AND expires_at > NOW() AND used = FALSE`,
    [userId, token]
  );

  return result.rows.length > 0;
};

/**
 * Invalida un token de restablecimiento después de usarlo
 * @param {number} userId - ID del usuario
 * @param {string} token - Token a invalidar
 * @returns {Promise<void>}
 */
const invalidateResetToken = async (userId, token) => {
  await pool.query(
    `UPDATE password_reset_tokens SET used = TRUE 
     WHERE user_id = $1 AND token = $2`,
    [userId, token]
  );
};

/**
 * Actualiza la contraseña de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} newPassword - Nueva contraseña (ya hasheada)
 * @returns {Promise<Object>} - Usuario actualizado
 */
const updatePassword = async (userId, newPassword) => {
  const result = await pool.query(
    `UPDATE users SET password = $1 
     WHERE id = $2 
     RETURNING id, email, first_name, last_name`,
    [newPassword, userId]
  );

  return result.rows[0];
};


/**
 * Guarda un token de verificación para un usuario
 * @param {number} userId - ID del usuario
 * @param {string} token - Token de verificación
 * @returns {Promise<void>}
 */
const saveVerificationToken = async (userId, token) => {
  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token, created_at, expires_at)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hour')
     ON CONFLICT (user_id) 
     DO UPDATE SET token = $2, created_at = NOW(), expires_at = NOW() + INTERVAL '24 hour', used = FALSE`,
    [userId, token]
  );
};

/**
 * Verifica si un token de verificación es válido
 * @param {number} userId - ID del usuario
 * @param {string} token - Token a verificar
 * @returns {Promise<boolean>} - True si el token es válido
 */
const checkVerificationToken = async (userId, token) => {
  const result = await pool.query(
    `SELECT * FROM email_verification_tokens 
     WHERE user_id = $1 AND token = $2 AND expires_at > NOW() AND used = FALSE`,
    [userId, token]
  );
  
  return result.rows.length > 0;
};

/**
 * Invalida un token de verificación después de usarlo
 * @param {number} userId - ID del usuario
 * @param {string} token - Token a invalidar
 * @returns {Promise<void>}
 */
const invalidateVerificationToken = async (userId, token) => {
  await pool.query(
    `UPDATE email_verification_tokens SET used = TRUE 
     WHERE user_id = $1 AND token = $2`,
    [userId, token]
  );
};

/**
 * Marca a un usuario como verificado
 * @param {number} userId - ID del usuario
 * @returns {Promise<Object>} - Usuario actualizado
 */
const verifyUser = async (userId) => {
  const result = await pool.query(
    `UPDATE users SET verified = TRUE 
     WHERE id = $1 
     RETURNING id, email, first_name, last_name, verified`,
    [userId]
  );
  
  return result.rows[0];
};

module.exports = {
  findByIdentification,
  findByEmail,
  getUserById,
  updateUserStatus,
  findByTypeIdentification,
  getUserByIdNum,
  updateUserPlan,
  getUserPaymentHistory,
  saveResetToken,
  checkResetToken,
  invalidateResetToken,
  updatePassword,
  saveVerificationToken,
  checkVerificationToken,
  invalidateVerificationToken,
  verifyUser,
};
