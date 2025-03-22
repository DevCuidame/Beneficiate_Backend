const pool = require('../../../config/connection');

const saveImage = async (data) => {
  const { user_id, public_name, private_name, image_path } = data;

  try {
    const checkResult = await pool.query(
      'SELECT id FROM user_images WHERE user_id = $1',
      [user_id]
    );

    let result;

    if (checkResult.rows.length > 0) {
      const imageId = checkResult.rows[0].id;
      result = await pool.query(
        `UPDATE user_images 
         SET public_name = $1, private_name = $2, image_path = $3, uploaded_at = NOW()
         WHERE id = $4 
         RETURNING *`,
        [public_name, private_name, image_path, imageId]
      );
    } else {
      result = await pool.query(
        `INSERT INTO user_images (user_id, public_name, private_name, image_path, uploaded_at)
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING *`,
        [user_id, public_name, private_name, image_path]
      );
    }

    return result.rows[0];
  } catch (error) {
    console.error('Database error while saving image:', error);
    throw new ValidationError(
      `Error processing image in database: ${error.message}`
    );
  }
};

const getImagesByUser = async (user_id) => {
  const result = await pool.query(
    'SELECT * FROM user_images WHERE user_id = $1',
    [user_id]
  );
  return result.rows;
};

const updateImage = async (data) => {
  const { public_name, private_name, image_path } = data;

  const result = await pool.query(
    `UPDATE user_images SET public_name = $1, private_name = $2, image_path = $3, uploaded_at = NOW()
       WHERE id = $4 RETURNING *`,
    [public_name, private_name, image_path, id]
  );
  return result.rows[0];
};

const deleteImage = async (id) => {
  await pool.query('DELETE FROM user_images WHERE id = $1', [id]);
  return { message: 'Imagen eliminada correctamente' };
};

module.exports = { saveImage, getImagesByUser, deleteImage, updateImage };
