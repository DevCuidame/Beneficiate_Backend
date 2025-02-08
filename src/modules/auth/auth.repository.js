const pool = require('../../config/connection');
const bcrypt = require('bcrypt');

const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findByIdentification = async (identification_number) => {
  const result = await pool.query('SELECT * FROM users WHERE identification_number = $1', [identification_number]);
  return result.rows[0];
};

const createUser = async (userData) => {
  const { first_name, last_name, identification_type, identification_number, address, city_id, phone, email, password, verified, plan_id } = userData;


  const result = await pool.query(
    `INSERT INTO users (first_name, last_name, identification_type, identification_number, address, city_id, phone, email, password, verified, plan_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [first_name, last_name, identification_type, identification_number, address, city_id, phone, email, password, verified, plan_id]
  );

  return result.rows[0];
};

module.exports = { findByEmail, createUser, findByIdentification };
