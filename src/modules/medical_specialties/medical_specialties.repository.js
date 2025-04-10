const pool = require('../../config/connection');

const findMedicalSpecialtyById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM medical_specialties WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const getAll = async () => {
  const result = await pool.query(`
    SELECT * FROM medical_specialties
    ORDER BY 
      CASE 
        WHEN name = 'Ginecología' THEN 1
        WHEN name = 'Pediatría' THEN 2
        WHEN name = 'Medicina Interna' THEN 3
        WHEN name = 'Cardiología' THEN 4
        WHEN name = 'Neurología' THEN 5
        ELSE 6
      END,
      name ASC
  `);
  return result.rows || [];
};


const createMedicalSpecialty = async (specialtyData) => {
  const { name, description, public_name, private_name, image_path } = specialtyData;
  const query = `
    INSERT INTO medical_specialties (
      name,
      description,
      public_name,
      private_name,
      image_path
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [name, description, public_name, private_name, image_path];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateMedicalSpecialty = async (id, specialtyData) => {
  const { name, description, public_name, private_name, image_path } = specialtyData;
  const query = `
    UPDATE medical_specialties SET
      name = $1,
      description = $2,
      public_name = $3,
      private_name = $4,
      image_path = $5
    WHERE id = $6
    RETURNING *;
  `;
  const values = [name, description, public_name, private_name, image_path, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteMedicalSpecialty = async (id) => {
  const query = 'DELETE FROM medical_specialties WHERE id = $1';
  await pool.query(query, [id]);
  return { message: 'Medical specialty deleted successfully' };
};

module.exports = {
  findMedicalSpecialtyById,
  getAll,
  createMedicalSpecialty,
  updateMedicalSpecialty,
  deleteMedicalSpecialty,
};
