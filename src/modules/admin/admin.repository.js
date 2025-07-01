const pool = require("../../config/connection");

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
};

const findAllPlans = async () => {
  const query = `
        SELECT * FROM plans;
    `;

  const result = await pool.query(query);
  return result.rows;
};

const createPlan = async (planData) => {
  const {
    name,
    description,
    price,
    duration_days,
    max_beneficiaries,
    is_active,
    code,
  } = planData;

  const result = await pool.query(
    `INSERT INTO "plans" (name, description, price, duration_days, max_beneficiaries, is_active, code) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      name,
      description,
      price,
      duration_days,
      max_beneficiaries,
      is_active,
      code,
    ]
  );

  return result.rows[0];
};

const updatePlan = async (id, fields, values) => {
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `
    UPDATE "plans"
    SET ${fields.join(', ')}
    WHERE id = $${values.length}
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};


module.exports = {
  findAllUsers,
  findAllPlans,
  createPlan,
  updatePlan,
};
