// GenericRepository.js
const pool = require('../../config/connection');

class GenericRepository {
  constructor(tableName) {
    this.table = tableName;
  }

  async findAll() {
    const result = await pool.query(`SELECT * FROM ${this.table}`);
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query(`SELECT * FROM ${this.table} WHERE id = $1`, [id]);
    return result.rows[0];
  }

  async findByBeneficiary(id) {
    const result = await pool.query(`SELECT * FROM ${this.table} WHERE beneficiary = $1`, [id]);
    return result.rows[0];
  }


  async create(data) {
    const keys = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${this.table} (${keys}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setQuery = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const query = `UPDATE ${this.table} SET ${setQuery} WHERE id = $${keys.length + 1} RETURNING *`;
    const result = await pool.query(query, [...values, id]);
    return result.rows[0];
  }

  async delete(id) {
    await pool.query(`DELETE FROM ${this.table} WHERE id = $1`, [id]);
    return { message: 'Registro eliminado' };
  }
}

module.exports = GenericRepository;