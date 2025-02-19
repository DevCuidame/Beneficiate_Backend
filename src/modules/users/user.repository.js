const pool = require('../../config/connection');
const { formatDatesInData } = require('../../utils/date.util');

const findByIdentification = async (identification_number) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE identification_number = $1',
    [identification_number]
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





module.exports = { findByIdentification, findByEmail, getUserById };
