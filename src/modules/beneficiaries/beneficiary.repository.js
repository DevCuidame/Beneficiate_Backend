const pool = require('../../config/connection');
const { formatDatesInData } = require('../../utils/date.util');

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

// Metodo creado para obtener la informacion de la salud del beneficiario.

const getBeneficiaryHealthData = async (beneficiary_id) => {
  const query = `
    SELECT 
      COALESCE(hc.health_conditions, '[]') AS health_conditions,
      COALESCE(a.allergies, '[]') AS allergies, 
      COALESCE(d.diseases, '[]') AS diseases, 
      COALESCE(fh.family_history, '[]') AS family_history, 
      COALESCE(hm.medical_history, '[]') AS medical_history, 
      COALESCE(m.medications, '[]') AS medications, 
      COALESCE(v.vaccinations, '[]') AS vaccinations
    FROM beneficiaries b
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'disability', disability,
          'pregnant', pregnant,
          'scars_description', scars_description,
          'tattoos_description', tattoos_description,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS health_conditions
      FROM beneficiary_health_conditions 
      GROUP BY beneficiary_id
    ) hc ON b.id = hc.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT('type', allergy_type, 'description', description, 'severity', severity)
      ) AS allergies 
      FROM beneficiary_allergies 
      GROUP BY beneficiary_id
    ) a ON b.id = a.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT('disease', disease, 'diagnosed_date', diagnosed_date, 'treatment_required', treatment_required)
      ) AS diseases 
      FROM beneficiary_diseases 
      GROUP BY beneficiary_id
    ) d ON b.id = d.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT('type', history_type, 'relationship', relationship, 'description', description)
      ) AS family_history 
      FROM beneficiary_family_history 
      GROUP BY beneficiary_id
    ) fh ON b.id = fh.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT('type', history_type, 'description', description, 'history_date', history_date)
      ) AS medical_history 
      FROM beneficiary_medical_history 
      GROUP BY beneficiary_id
    ) hm ON b.id = hm.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT('medication', medication, 'laboratory', laboratory, 'prescription', prescription, 'dosage', dosage, 'frequency', frequency)
      ) AS medications 
      FROM beneficiary_medications 
      GROUP BY beneficiary_id
    ) m ON b.id = m.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT('vaccine', vaccine, 'vaccination_date', vaccination_date)
      ) AS vaccinations 
      FROM beneficiary_vaccinations 
      GROUP BY beneficiary_id
    ) v ON b.id = v.beneficiary_id
    WHERE b.id = $1;
  `;

  const { rows } = await pool.query(query, [beneficiary_id]);

  if (!rows.length) return null; // Retorna null si no hay datos

  // Aplicar formato a las fechas
  return formatDatesInData(rows[0], [
    'diagnosed_date', 'history_date', 'vaccination_date', 'created_at', 'updated_at'
  ]);
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

module.exports = { findByIdentification, findByUserId, createBeneficiary, updateBeneficiary, removeBeneficiary, findById, countByUserId, getBeneficiaryHealthData };
