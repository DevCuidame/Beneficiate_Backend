const pool = require('../../config/connection');

const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findByIdentification = async (identification_number) => {
  const result = await pool.query('SELECT * FROM users WHERE identification_number = $1', [identification_number]);
  return result.rows[0];
};

const createUser = async (userData) => {
  const { first_name, last_name, identification_type, identification_number, gender, birth_date, address, city_id, phone, email, password, verified, plan_id } = userData;

  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, identification_type, identification_number, address, gender, birth_date, city_id, phone, email, password, verified, plan_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
    [first_name, last_name, identification_type, identification_number, address,gender, birth_date, city_id, phone, email, password, verified, plan_id]
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


const saveRefreshToken = async (userId, token) => {
  
  await pool.query(
    'INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET token = $2',
    [userId, token]
  );
};

const findRefreshToken = async (userId, token) => {
  const result = await pool.query(
    'SELECT token FROM refresh_tokens WHERE user_id = $1 AND token = $2',
    [userId, token]
  );
  return result.rowCount > 0;
};



module.exports = { findByEmail, createUser, findByIdentification, saveRefreshToken, findRefreshToken, verifyUser };
