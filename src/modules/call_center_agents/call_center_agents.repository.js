const pool = require('../../config/connection');

const findCallCenterAgentById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM call_center_agents WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const findCallCenterAgentByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM call_center_agents WHERE user_id = $1',
    [userId]
  );
  return result.rows[0];
};

const getAll = async () => {
  const result = await pool.query('SELECT * FROM call_center_agents');
  return result.rows || [];
};

const createCallCenterAgent = async (agentData) => {
  const { user_id, agent_code, status, created_at } = agentData;
  const query = `
    INSERT INTO call_center_agents (
      user_id,
      agent_code,
      status,
      created_at
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [
    user_id,
    agent_code,
    status || 'ACTIVE',
    created_at || new Date()
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateCallCenterAgent = async (id, agentData) => {
  const { user_id, agent_code, status } = agentData;
  const query = `
    UPDATE call_center_agents SET
      user_id = $1,
      agent_code = $2,
      status = $3
    WHERE id = $4
    RETURNING *;
  `;
  const values = [user_id, agent_code, status, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteCallCenterAgent = async (id) => {
  const query = 'DELETE FROM call_center_agents WHERE id = $1';
  await pool.query(query, [id]);
  return { message: 'Call center agent deleted successfully' };
};

module.exports = {
  findCallCenterAgentById,
  findCallCenterAgentByUserId,
  getAll,
  createCallCenterAgent,
  updateCallCenterAgent,
  deleteCallCenterAgent,
};
