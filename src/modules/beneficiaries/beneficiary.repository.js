const pool = require('../../config/connection');
const { formatDatesInData } = require('../../utils/date.util');

const findByIdentification = async (identification_number) => {
  const result = await pool.query(
    'SELECT * FROM beneficiaries WHERE identification_number = $1',
    [identification_number]
  );
  return result.rows[0];
};

const findByTypeIdentification = async (
  identification_type,
  identification_number
) => {
  const result = await pool.query(
    'SELECT * FROM beneficiaries WHERE identification_type = $1 AND identification_number = $2',
    [identification_type, identification_number]
  );

  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT 
      *
     FROM beneficiaries 
     WHERE email = $1;`,
    [email]
  );

  return formatDatesInData(result.rows[0] || null, [
    'birth_date',
    'created_at',
  ]);
};

const findById = async (id) => {
  const result = await pool.query('SELECT * FROM beneficiaries WHERE id = $1', [
    id,
  ]);
  return result.rows[0];
};

const getBeneficiaryByUserId = async (beneficiaryId, userId) => {
  const query = 'SELECT id FROM beneficiaries WHERE id = $1 AND user_id = $2';
  const result = await pool.query(query, [beneficiaryId, userId]);
  return result.rows[0] || null;
};

const countUserBeneficiaries = async (userId) => {
  const query =
    'SELECT COUNT(*) AS count FROM beneficiaries WHERE user_id = $1';
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count, 10);
};

const countByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) FROM beneficiaries WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

const findByUserId = async (user_id) => {
  const result = await pool.query(
    'SELECT * FROM beneficiaries WHERE user_id = $1 AND removed = FALSE',
    [user_id]
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
    `INSERT INTO password_reset_tokens (beneficiary_id, token, created_at, expires_at)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour')
     ON CONFLICT (user_id) 
     DO UPDATE SET token = $2, created_at = NOW(), expires_at = NOW() + INTERVAL '1 hour', used = FALSE`,
    [userId, token]
  );
};

/**
 * Verifica si un token de restablecimiento es válido
 * @param {number} beneficiaryId - ID del usuario
 * @param {string} token - Token a verificar
 * @returns {Promise<boolean>} - True si el token es válido
 */
const checkResetToken = async (beneficiaryId, token) => {
  const result = await pool.query(
    `SELECT * FROM password_reset_tokens 
     WHERE beneficiary_id = $1 AND token = $2 AND expires_at > NOW() AND used = FALSE`,
    [beneficiaryId, token]
  );

  return result.rows.length > 0;
};

/**
 * Invalida un token de restablecimiento después de usarlo
 * @param {number} beneficiaryId - ID del usuario
 * @param {string} token - Token a invalidar
 * @returns {Promise<void>}
 */
const invalidateResetToken = async (beneficiaryId, token) => {
  await pool.query(
    `UPDATE password_reset_tokens SET used = TRUE 
     WHERE beneficiary_id = $1 AND token = $2`,
    [beneficiaryId, token]
  );
};

// Metodo creado para obtener la informacion de la salud del beneficiario.
const getBeneficiaryHealthData = async (beneficiary_id) => {
  const query = `
    SELECT 
      COALESCE(d.distinctives, '[]') AS distinctives,
      COALESCE(di.disabilities, '[]') AS disabilities,
      COALESCE(a.allergies, '[]') AS allergies, 
      COALESCE(dz.diseases, '[]') AS diseases, 
      COALESCE(fh.family_history, '[]') AS family_history, 
      COALESCE(hm.medical_history, '[]') AS medical_history, 
      COALESCE(m.medications, '[]') AS medications, 
      COALESCE(v.vaccinations, '[]') AS vaccinations
    FROM beneficiaries b
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'description', description,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS distinctives
      FROM beneficiary_distinctives 
      GROUP BY beneficiary_id
    ) d ON b.id = d.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'name', name,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS disabilities
      FROM beneficiary_disabilities 
      GROUP BY beneficiary_id
    ) di ON b.id = di.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'allergy_type', allergy_type,
          'description', description,
          'severity', severity,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS allergies 
      FROM beneficiary_allergies 
      GROUP BY beneficiary_id
    ) a ON b.id = a.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'disease', disease,
          'diagnosed_date', diagnosed_date,
          'treatment_required', treatment_required,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS diseases 
      FROM beneficiary_diseases 
      GROUP BY beneficiary_id
    ) dz ON b.id = dz.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'history_type', history_type,
          'relationship', relationship,
          'description', description,
          'history_date', history_date,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS family_history 
      FROM beneficiary_family_history 
      GROUP BY beneficiary_id
    ) fh ON b.id = fh.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'history_type', history_type,
          'description', description,
          'history_date', history_date,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS medical_history 
      FROM beneficiary_medical_history 
      GROUP BY beneficiary_id
    ) hm ON b.id = hm.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'medication', medication,
          'laboratory', laboratory,
          'prescription', prescription,
          'dosage', dosage,
          'frequency', frequency,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS medications 
      FROM beneficiary_medications 
      GROUP BY beneficiary_id
    ) m ON b.id = m.beneficiary_id
    LEFT JOIN (
      SELECT beneficiary_id, JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'vaccine', vaccine,
          'vaccination_date', vaccination_date,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) AS vaccinations 
      FROM beneficiary_vaccinations 
      GROUP BY beneficiary_id
    ) v ON b.id = v.beneficiary_id
    WHERE b.id = $1;
  `;

  const { rows } = await pool.query(query, [beneficiary_id]);

  if (!rows.length) return null;

  return formatDatesInData(rows[0], [
    'diagnosed_date',
    'history_date',
    'vaccination_date',
    'created_at',
    'updated_at',
  ]);
};

const createBeneficiary = async (beneficiaryData) => {
  const {
    user_id,
    first_name,
    last_name,
    identification_type,
    identification_number,
    phone,
    birth_date,
    gender,
    city_id,
    address,
    blood_type,
    health_provider,
    prepaid_health,
    work_risk_insurance,
    funeral_insurance,
    removed,
    created_at,
    email,
  } = beneficiaryData;

  const result = await pool.query(
    `INSERT INTO beneficiaries (
      user_id, first_name, last_name, identification_type, identification_number, 
      phone, birth_date, gender, city_id, address, blood_type, 
      health_provider, prepaid_health, work_risk_insurance, funeral_insurance, removed, created_at, email
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
    [
      user_id,
      first_name,
      last_name,
      identification_type,
      identification_number,
      phone,
      birth_date,
      gender,
      city_id,
      address,
      blood_type,
      health_provider,
      prepaid_health,
      work_risk_insurance,
      funeral_insurance,
      removed,
      created_at,
      email,
    ]
  );

  return result.rows[0];
};

const updateBeneficiary = async (id, beneficiaryData) => {
  const result = await pool.query(
    `UPDATE beneficiaries SET 
      first_name = $1, 
      last_name = $2, 
      identification_type = $3, 
      identification_number = $4, 
      phone = $5, 
      birth_date = $6, 
      gender = $7, 
      city_id = $8, 
      address = $9, 
      blood_type = $10, 
      health_provider = $11, 
      prepaid_health = $12, 
      work_risk_insurance = $13, 
      funeral_insurance = $14,
      email = $15
    WHERE id = $16
    RETURNING *`,
    [
      beneficiaryData.first_name,
      beneficiaryData.last_name,
      beneficiaryData.identification_type,
      beneficiaryData.identification_number,
      beneficiaryData.phone,
      beneficiaryData.birth_date,
      beneficiaryData.gender,
      beneficiaryData.city_id,
      beneficiaryData.address,
      beneficiaryData.blood_type,
      beneficiaryData.health_provider,
      beneficiaryData.prepaid_health,
      beneficiaryData.work_risk_insurance,
      beneficiaryData.funeral_insurance,
      id,
    ]
  );

  return result.rows[0];
};

module.exports = { updateBeneficiary };

const removeBeneficiary = async (id) => {
  await pool.query('UPDATE beneficiaries SET removed = TRUE WHERE id = $1', [
    id,
  ]);
  return { message: 'Beneficiario Eliminado' };
};

const updateBeneficiaryPassword = async (beneficiaryId, hashedPassword) => {
  try {
    const result = await pool.query(
      'UPDATE beneficiaries SET password = $1 WHERE id = $2 RETURNING *',
      [hashedPassword, beneficiaryId]
    );

    if (result.rows.length === 0) {
      throw new Error(`No se encontró beneficiario con ID ${beneficiaryId}`);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error al actualizar contraseña del beneficiario:', error);
    throw error;
  }
};
module.exports = {
  findByIdentification,
  findByUserId,
  createBeneficiary,
  updateBeneficiary,
  removeBeneficiary,
  findById,
  countByUserId,
  saveResetToken,
  checkResetToken,
  invalidateResetToken,
  getBeneficiaryHealthData,
  getBeneficiaryByUserId,
  countUserBeneficiaries,
  findByTypeIdentification,
  findByEmail,
  updateBeneficiaryPassword,
};
