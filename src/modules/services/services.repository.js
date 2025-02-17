const pool = require('../../config/connection');

const getAllServices = async () => {
    const result = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    return result.rows;
};

const getServiceById = async (id) => {
    const result = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    return result.rows[0];
};

const createService = async (serviceData) => {
    const { name, image_path, whatsapp_link } = serviceData;
    const result = await pool.query(
        `INSERT INTO services (name, image_path, whatsapp_link) 
         VALUES ($1, $2, $3) RETURNING *`,
        [name, image_path, whatsapp_link]
    );
    return result.rows[0];
};

const updateService = async (id, serviceData) => {
    const { name, image_path, whatsapp_link } = serviceData;
    const result = await pool.query(
        `UPDATE services SET 
            name = $1, 
            image_path = $2, 
            whatsapp_link = $3, 
            created_at = CURRENT_TIMESTAMP 
         WHERE id = $4 RETURNING *`,
        [name, image_path, whatsapp_link, id]
    );
    return result.rows[0];
};

const deleteService = async (id) => {
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    return { message: 'Servicio eliminado correctamente' };
};

module.exports = {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService
};
