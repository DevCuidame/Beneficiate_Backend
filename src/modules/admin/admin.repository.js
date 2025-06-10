const pool = require('../../config/connection');

const findAllUsers = async () => {
    const query = `
        SELECT 
            u.id, 
            u.first_name, 
            u.last_name, 
            u.email, 
            u.verified, 
            u.identification_type, 
            u.identification_number, 
            u.gender,
            u.created_at,
            t.name AS city_name,
            d.name AS department_name,
            p.name As plan_name
        FROM users u
        LEFT JOIN plans p ON u.plan_id = p.id
        LEFT JOIN townships t ON u.city_id = t.id
        LEFT JOIN departments d ON t.department_id = d.id
        ORDER BY u.created_at DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
}

module.exports = {
    findAllUsers,
}