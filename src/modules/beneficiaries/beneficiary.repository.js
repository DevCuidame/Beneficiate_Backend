const pool = require('../../config/connection');

const findByIdentification = async (identification_number) => {
  const result = await pool.query('SELECT * FROM beneficiaries WHERE identification_number = $1', [identification_number]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await pool.query('SELECT * FROM beneficiaries WHERE id = $1', [id]);
  return result.rows[0];
};

const countByUserId = async (userId) => {
  const result = await pool.query('SELECT COUNT(*) FROM beneficiaries WHERE user_id = $1', [userId]);
  return parseInt(result.rows[0].count, 10);
};


const findByUserId = async (user_id) => {
  const result = await pool.query('SELECT * FROM beneficiaries WHERE user_id = $1 AND removed = FALSE', [user_id]);
  return result.rows;
};

const createBeneficiary = async (beneficiaryData) => {
  const {
    user_id, first_name, last_name, identification_type, identification_number,
    phone, birth_date, gender, city_id, address, blood_type,
    health_provider, prepaid_health, work_risk_insurance, funeral_insurance, removed, created_at
  } = beneficiaryData;

  const result = await pool.query(
    `INSERT INTO beneficiaries (
      user_id, first_name, last_name, identification_type, identification_number, 
      phone, birth_date, gender, city_id, address, blood_type, 
      health_provider, prepaid_health, work_risk_insurance, funeral_insurance, removed, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
    [user_id, first_name, last_name, identification_type, identification_number,
      phone, birth_date, gender, city_id, address, blood_type,
      health_provider, prepaid_health, work_risk_insurance, funeral_insurance, removed, created_at]
  );

  return result.rows[0];
};

const updateBeneficiary = async (id, beneficiaryData) => {
  const {
    first_name, last_name, identification_type, identification_number,
    phone, birth_date, gender, city_id, address, blood_type,
    health_provider, prepaid_health, work_risk_insurance, funeral_insurance
  } = beneficiaryData;

  const result = await pool.query(
    `UPDATE beneficiaries SET 
      first_name = $1, last_name = $2, identification_type = $3, identification_number = $4, 
      phone = $5, birth_date = $6, gender = $7, city_id = $8, address = $9, blood_type = $10, 
      health_provider = $11, prepaid_health = $12, work_risk_insurance = $13, funeral_insurance = $14
    WHERE id = $15 RETURNING *`,
    [first_name, last_name, identification_type, identification_number, phone, birth_date, gender, city_id,
      address, blood_type, health_provider, prepaid_health, work_risk_insurance, funeral_insurance, id]
  );

  return result.rows[0];
};

const removeBeneficiary = async (id) => {
  await pool.query('UPDATE beneficiaries SET removed = TRUE WHERE id = $1', [id]);
  return { message: 'Beneficiario Eliminado' };
};

module.exports = { findByIdentification, findByUserId, createBeneficiary, updateBeneficiary, removeBeneficiary, findById, countByUserId };
