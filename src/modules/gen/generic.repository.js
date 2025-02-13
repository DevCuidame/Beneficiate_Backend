const pool = require('../../config/connection');

const createRecord = async (table, data) => {
  const columns = Object.keys(data).join(', ');
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `INSERT INTO ${table} (${columns}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

const findById = async (table, id) => {
  const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return result.rows[0];
};

const findByBeneficiaryId = async (table, beneficiary_id) => {
  const result = await pool.query(`SELECT * FROM ${table} WHERE beneficiary_id = $1`, [beneficiary_id]);
  return result.rows;
};

const updateRecord = async (table, id, data) => {
  const updates = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(data);

  const query = `UPDATE ${table} SET ${updates}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`;
  const result = await pool.query(query, [...values, id]);
  return result.rows[0];
};

const removeRecord = async (table, id) => {
  await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return { message: 'Registro eliminado' };
};

module.exports = {
  createRecord,
  findById,
  findByBeneficiaryId,
  updateRecord,
  removeRecord,
};
