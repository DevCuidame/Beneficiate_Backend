const pool = require('../../config/connection');

const findAllPlans = async () => {
  const result = await pool.query(
    `SELECT id, name, description, price, duration_days, max_beneficiaries, is_active, created_at
     FROM plans
     WHERE is_active = TRUE`
  );
  return result.rows;
};

const findPlanById = async (plan_id) => {
  const result = await pool.query(
    `SELECT id, name, description, price, duration_days, max_beneficiaries, is_active, created_at
     FROM plans
     WHERE id = $1`,
    [plan_id]
  );
  return result.rows[0] || null;
};

const createPlan = async (planData) => {
  const { name, description, price, duration_days, max_beneficiaries, is_active } = planData;

  const result = await pool.query(
    `INSERT INTO plans (name, description, price, duration_days, max_beneficiaries, is_active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, description, price, duration_days, max_beneficiaries, is_active]
  );

  return result.rows[0];
};

const updatePlan = async (plan_id, planData) => {
  const { name, description, price, duration_days, max_beneficiaries, is_active } = planData;

  const result = await pool.query(
    `UPDATE plans
     SET name = $1, description = $2, price = $3, duration_days = $4, max_beneficiaries = $5, is_active = $6
     WHERE id = $7
     RETURNING *`,
    [name, description, price, duration_days, max_beneficiaries, is_active, plan_id]
  );

  return result.rows[0];
};

const deletePlan = async (plan_id) => {
  await pool.query(`DELETE FROM plans WHERE id = $1`, [plan_id]);
  return { message: 'Plan eliminado exitosamente' };
};

module.exports = { findAllPlans, findPlanById, createPlan, updatePlan, deletePlan };
