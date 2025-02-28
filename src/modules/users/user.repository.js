const pool = require('../../config/connection');
const { formatDatesInData } = require('../../utils/date.util');

const findByIdentification = async (identification_number) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE identification_number = $1',
    [identification_number]
  );
  return result.rows[0];
};

const findByTypeIdentification = async (identification_type, identification_number) => {
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


const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT 
      id, first_name, last_name, identification_type, identification_number, 
      address, city_id, phone, gender, birth_date, email, verified, created_at, plan_id
     FROM users 
     WHERE email = $1;`,
    [email]
  );

  return formatDatesInData(result.rows[0] || null, ['birth_date', 'created_at']);
};


const updateUserStatus = async (user_id, isOnline) => {
  await pool.query(
      'UPDATE users SET online_status = $1 WHERE id = $2',
      [isOnline, user_id]
  );
};




module.exports = { findByIdentification, findByEmail, getUserById, updateUserStatus, findByTypeIdentification};
