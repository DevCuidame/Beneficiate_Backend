const pool = require('../../config/connection');

const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);
  return result.rows[0];
};

const findByIdentification = async (identification_number) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE identification_number = $1',
    [identification_number]
  );
  return result.rows[0];
};

const createUser = async (userData) => {
  const {
    first_name,
    last_name,
    identification_type,
    identification_number,
    gender,
    birth_date,
    address,
    city_id,
    phone,
    email,
    password,
    verified,
    plan_id,
  } = userData;

  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, identification_type, identification_number, address, gender, birth_date, city_id, phone, email, password, verified, plan_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [
      first_name,
      last_name,
      identification_type,
      identification_number,
      address,
      gender,
      birth_date,
      city_id,
      phone,
      email,
      password,
      verified,
      plan_id,
    ]
  );

  return result.rows[0];
};

const verifyUser = async (email) => {
  const result = await pool.query(
    `UPDATE users SET verified = true WHERE email = $1 RETURNING *`,
    [email]
  );

  return result.rowCount > 0;
};

const saveRefreshToken = async (id, token, accountType = 'user') => {
  try {
    if (accountType === 'beneficiary') {
      await pool.query(
        'INSERT INTO beneficiary_refresh_tokens (beneficiary_id, token) VALUES ($1, $2) ON CONFLICT (beneficiary_id) DO UPDATE SET token = $2',
        [id, token]
      );
    } else {
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET token = $2',
        [id, token]
      );
    }
  } catch (error) {
    console.error('Error al guardar refresh token:', error);
    throw error;
  }
};

const findRefreshToken = async (id, token, accountType = 'user') => {
  try {
    let result;
    
    if (accountType === 'beneficiary') {
      result = await pool.query(
        'SELECT token FROM beneficiary_refresh_tokens WHERE beneficiary_id = $1 AND token = $2',
        [id, token]
      );
    } else {
      result = await pool.query(
        'SELECT token FROM refresh_tokens WHERE user_id = $1 AND token = $2',
        [id, token]
      );
    }
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error al buscar refresh token:', error);
    throw error;
  }
};

// Eliminar datos relacionados con el usuario
const deleteUserData = async (userId) => {
  try {
    await pool.query('DELETE FROM user_transactions WHERE user_id = $1', [
      userId,
    ]);

    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    console.log('Tokens de refresh eliminados');

    // Eliminar beneficiarios asociados si existen
    try {
      await pool.query('DELETE FROM beneficiaries WHERE user_id = $1', [
        userId,
      ]);
    } catch (e) {
      console.log('Error al eliminar beneficiarios:', e.message);
    }

    try {
      await pool.query('DELETE FROM agent_chats WHERE user_id = $1', [
        userId,
      ]);
    } catch (e) {
      console.log('Error al eliminar beneficiarios:', e.message);
    }

    try {
      await pool.query('DELETE FROM call_center_agents WHERE user_id = $1', [
        userId,
      ]);
    } catch (e) {
      console.log('Error al eliminar beneficiarios:', e.message);
    }

    try {
      await pool.query('DELETE FROM user_images WHERE user_id = $1', [userId]);
    } catch (e) {
      console.log('Error al eliminar imágenes de usuario:', e.message);
    }

    return true;
  } catch (error) {
    console.error('Error al eliminar datos de usuario:', error);
    throw error;
  }
};

const deleteUserAccount = async (userId) => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    return result.rowCount > 0;
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key violation
      const tableName = error.table;
      const constraint = error.constraint;
      throw new Error(
        `No se pudo eliminar el usuario porque existen datos relacionados en la tabla ${tableName} (restricción: ${constraint}). Por favor, elimine estos datos primero.`
      );
    }

    throw error;
  }
};

module.exports = {
  findByEmail,
  createUser,
  findByIdentification,
  saveRefreshToken,
  findRefreshToken,
  verifyUser,
  deleteUserAccount,
  deleteUserData,
};
