const pool = require('../../config/connection');

const findProfessionalImageById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM professional_images WHERE professional_id = $1',
    [id]
  );
  return result.rows[0];
};

const getAllProfessionalImages = async () => {
  const result = await pool.query('SELECT * FROM professional_images');
  return result.rows || [];
};

const createProfessionalImage = async (imageData) => {
  const {
    professional_id,
    public_name,
    private_name,
    profile_path,
    header_path,
    uploaded_at, // opcional, se puede omitir si se usa DEFAULT
  } = imageData;

  const query = `
    INSERT INTO professional_images (
      professional_id,
      public_name,
      private_name,
      profile_path,
      header_path,
      uploaded_at
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    professional_id,
    public_name,
    private_name,
    profile_path,
    header_path,
    uploaded_at || new Date(),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateProfessionalImage = async (id, imageData) => {
  const {
    professional_id,
    public_name,
    private_name,
    profile_path,
    header_path,
  } = imageData;

  const query = `
    UPDATE professional_images SET
      professional_id = $1,
      public_name = $2,
      private_name = $3,
      profile_path = $4,
      header_path = $5
    WHERE id = $6
    RETURNING *;
  `;

  const values = [
    professional_id,
    public_name,
    private_name,
    profile_path,
    header_path,
    id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteProfessionalImage = async (id) => {
  const query = 'DELETE FROM professional_images WHERE id = $1';
  await pool.query(query, [id]);
  return { message: 'Professional image deleted successfully' };
};

module.exports = {
  findProfessionalImageById,
  getAllProfessionalImages,
  createProfessionalImage,
  updateProfessionalImage,
  deleteProfessionalImage,
};
