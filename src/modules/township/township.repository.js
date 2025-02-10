const pool = require('../../config/connection');

const findLocationByTownshipId = async (township_id) => {
  const result = await pool.query(
    `SELECT 
      t.id AS township_id,
      t.name AS township_name,
      t.code AS township_code,
      d.id AS department_id,
      d.name AS department_name
    FROM townships t
    INNER JOIN departments d ON t.department_id = d.id
    WHERE t.id = $1`,
    [township_id]
  );

  return result.rows;
};

const findAllDepartments = async () => {
  const result = await pool.query(
    `SELECT 
      id, 
      name, 
      code AS department_code 
    FROM departments 
    ORDER BY name ASC`
  );
  return result.rows;
};

const findTownshipsByDepartmentId = async (department_id) => {
  const result = await pool.query(
    `SELECT 
      id, 
      name, 
      code AS township_code, 
      department_id AS department_id
    FROM townships 
    WHERE department_id = $1
    ORDER BY name ASC`,
    [department_id]
  );
  return result.rows;
};


module.exports = {
  findLocationByTownshipId,
  findAllDepartments,
  findTownshipsByDepartmentId,
};
