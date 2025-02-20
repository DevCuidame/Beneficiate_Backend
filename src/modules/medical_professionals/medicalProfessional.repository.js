const pool = require('../../config/connection');

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
    specialty,
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
      specialty,
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
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *;
  `;

  const values = [
    user_id,
    nationality,
    profession,
    specialty,
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
    specialty,
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
      specialty = $3,
      medical_registration = $4,
      professional_card_number = $5,
      university = $6,
      graduation_year = $7,
      additional_certifications = $8,
      years_experience = $9,
      consultation_address = $10,
      institution_name = $11,
      attention_township_id = $12,
      consultation_schedule = $13,
      consultation_modes = $14,
      weekly_availability = $15
    WHERE id = $16
    RETURNING *;
  `;

  const values = [
    nationality,
    profession,
    specialty,
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
};
