const pool = require('../../config/connection');

const findByIdentification = async (identification_number) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE identification_number = $1',
    [identification_number]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

//TODO: Add gender and birth_date information

const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT 
      id, first_name, last_name, identification_type, identification_number, 
      address, city_id, phone, email, verified, created_at, plan_id
     FROM users 
     WHERE email = $1;`,
    [email]
  );

  return result.rows[0] || null; // Retorna un solo usuario o `null` si no existe
};



module.exports = { findByIdentification, findByEmail, findById };
