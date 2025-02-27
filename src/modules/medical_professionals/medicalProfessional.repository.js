const pool = require('../../config/connection');


const getMedicalProfessionalsBySpecialtyId = async (specialtyId) => {
  const query = `
    SELECT mp.*
    FROM medical_professionals mp
    INNER JOIN medical_professionals_specialties mps 
      ON mp.id = mps.medical_professional_id
    WHERE mps.specialty_id = $1
  `;
  const result = await pool.query(query, [specialtyId]);
  if (!result.rows.length) {
    return [];
  }
  return result.rows;
};

const findMedicalProfessionalById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM medical_professionals WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const getAll = async () => {
  const result = await pool.query('SELECT * FROM medical_professionals');
  return result.rows || [];
};


const findMedicalProfessionalByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM medical_professionals WHERE user_id = $1',
    [userId]
  );
  return result.rows[0];
};

const createMedicalProfessional = async (professionalData) => {
  const {
    user_id,
    nationality,
    profession,
    medical_registration,
    professional_card_number,
    university,
    graduation_year,
    additional_certifications,
    years_experience,
    consultation_address,
    institution_name,
    attention_township_id,
    consultation_schedule,
    consultation_modes,
    weekly_availability,
    created_at,
  } = professionalData;

  const query = `
    INSERT INTO medical_professionals (
      user_id,
      nationality,
      profession,
      medical_registration,
      professional_card_number,
      university,
      graduation_year,
      additional_certifications,
      years_experience,
      consultation_address,
      institution_name,
      attention_township_id,
      consultation_schedule,
      consultation_modes,
      weekly_availability,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *;
  `;

  const values = [
    user_id,
    nationality,
    profession,
    medical_registration,
    professional_card_number,
    university,
    graduation_year,
    additional_certifications,
    years_experience,
    consultation_address,
    institution_name,
    attention_township_id,
    consultation_schedule,
    consultation_modes,
    weekly_availability,
    created_at,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateMedicalProfessional = async (id, professionalData) => {
  const {
    nationality,
    profession,
    medical_registration,
    professional_card_number,
    university,
    graduation_year,
    additional_certifications,
    years_experience,
    consultation_address,
    institution_name,
    attention_township_id,
    consultation_schedule,
    consultation_modes,
    weekly_availability,
  } = professionalData;

  const query = `
    UPDATE medical_professionals SET
      nationality = $1,
      profession = $2,
      medical_registration = $3,
      professional_card_number = $4,
      university = $5,
      graduation_year = $6,
      additional_certifications = $7,
      years_experience = $8,
      consultation_address = $9,
      institution_name = $10,
      attention_township_id = $11,
      consultation_schedule = $112,
      consultation_modes = $13,
      weekly_availability = $14
    WHERE id = $15
    RETURNING *;
  `;

  const values = [
    nationality,
    profession,
    medical_registration,
    professional_card_number,
    university,
    graduation_year,
    additional_certifications,
    years_experience,
    consultation_address,
    institution_name,
    attention_township_id,
    consultation_schedule,
    consultation_modes,
    weekly_availability,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteMedicalProfessional = async (id) => {
  const query = 'DELETE FROM medical_professionals WHERE id = $1';
  await pool.query(query, [id]);
  return { message: 'Medical professional deleted successfully' };
};

module.exports = {
  findMedicalProfessionalById,
  findMedicalProfessionalByUserId,
  createMedicalProfessional,
  updateMedicalProfessional,
  deleteMedicalProfessional,
  getAll,
  getMedicalProfessionalsBySpecialtyId
};
