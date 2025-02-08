const pool = require('../../../config/connection');

const saveImage = async (data) => {
  const { beneficiary_id, public_name, private_name, image_path } = data;
  const result = await pool.query(
    `INSERT INTO beneficiary_images (beneficiary_id, public_name, private_name, image_path, uploaded_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [beneficiary_id, public_name, private_name, image_path]
  );
  return result.rows[0];
};

const getImagesByBeneficiary = async (beneficiary_id) => {
  const result = await pool.query(
    'SELECT * FROM beneficiary_images WHERE beneficiary_id = $1',
    [beneficiary_id]
  );
  return result.rows;
};

const updateImage = async (data) => {
  const { public_name, private_name, image_path } = data;

  const result = await pool.query(
    `UPDATE beneficiary_images SET public_name = $1, private_name = $2, image_path = $3, uploaded_at = NOW()
       WHERE id = $4 RETURNING *`,
    [public_name, private_name, image_path, id]
  );
  return result.rows[0];
};

const deleteImage = async (id) => {
  await pool.query('DELETE FROM beneficiary_images WHERE id = $1', [id]);
  return { message: 'Imagen eliminada correctamente' };
};

module.exports = { saveImage, getImagesByBeneficiary, deleteImage, updateImage };
