// src/modules/agent_chat/agent_chat.repository.js
const pool = require('../../config/connection');
const { formatDatesInData } = require('../../utils/date.util');

/**
 * Crea un nuevo chat entre un agente y un usuario
 * @param {Object} chatData - Datos del chat a crear
 * @returns {Promise<Object>} - Chat creado
 */
const createChat = async (chatData) => {
  const { agent_id, user_id, status } = chatData;
  
  const query = `
    INSERT INTO agent_chats (
      agent_id,
      user_id,
      status,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING *
  `;
  
  const values = [agent_id, user_id, status || 'ACTIVE'];
  
  try {
    const result = await pool.query(query, values);
    return formatDatesInData(result.rows[0], ['created_at', 'updated_at']);
  } catch (error) {
    console.error('Error al crear chat:', error);
    throw error;
  }
};

/**
 * Busca un chat por su ID
 * @param {number} chat_id - ID del chat
 * @returns {Promise<Object|null>} - Chat encontrado o null
 */
const findChatById = async (chat_id) => {
  const query = `
    SELECT * FROM agent_chats
    WHERE id = $1
  `;
  
  try {
    const result = await pool.query(query, [chat_id]);
    if (result.rows.length === 0) {
      return null;
    }
    return formatDatesInData(result.rows[0], ['created_at', 'updated_at']);
  } catch (error) {
    console.error('Error al buscar chat por ID:', error);
    throw error;
  }
};

/**
 * Busca los chats de un agente
 * @param {number} agent_id - ID del agente
 * @returns {Promise<Array>} - Lista de chats
 */
const findChatsByAgentId = async (agent_id) => {
  const query = `
    SELECT ac.*, u.first_name, u.last_name, u.email
    FROM agent_chats ac
    JOIN users u ON ac.user_id = u.id
    WHERE ac.agent_id = $1
    ORDER BY ac.updated_at DESC
  `;
  
  try {
    const result = await pool.query(query, [agent_id]);
    return result.rows.map(row => 
      formatDatesInData(row, ['created_at', 'updated_at'])
    );
  } catch (error) {
    console.error('Error al buscar chats por agente:', error);
    throw error;
  }
};



/**
 * Busca los chats de un usuario
 * @param {number} user_id - ID del usuario
 * @returns {Promise<Array>} - Lista de chats
 */
const findChatsByUserId = async (user_id) => {
  const query = `
    SELECT ac.*, cca.agent_code, u.first_name, u.last_name
    FROM agent_chats ac
    JOIN call_center_agents cca ON ac.agent_id = cca.id
    JOIN users u ON cca.user_id = u.id
    WHERE ac.user_id = $1
    ORDER BY ac.updated_at DESC
  `;
  
  try {
    const result = await pool.query(query, [user_id]);
    return result.rows.map(row => 
      formatDatesInData(row, ['created_at', 'updated_at'])
    );
  } catch (error) {
    console.error('Error al buscar chats por usuario:', error);
    throw error;
  }
};

/**
 * Busca chat activo entre un agente y un usuario
 * @param {number} agent_id - ID del agente
 * @param {number} user_id - ID del usuario
 * @returns {Promise<Object|null>} - Chat activo o null
 */
const findActiveChatBetweenAgentAndUser = async (agent_id, user_id) => {
  const query = `
    SELECT * FROM agent_chats
    WHERE agent_id = $1 AND user_id = $2 AND status = 'ACTIVE'
  `;
  
  try {
    const result = await pool.query(query, [agent_id, user_id]);
    if (result.rows.length === 0) {
      return null;
    }
    return formatDatesInData(result.rows[0], ['created_at', 'updated_at']);
  } catch (error) {
    console.error('Error al buscar chat activo:', error);
    throw error;
  }
};

/**
 * Actualiza un chat
 * @param {number} chat_id - ID del chat
 * @param {Object} updateData - Datos a actualizar
 * @returns {Promise<Object>} - Chat actualizado
 */
const updateChat = async (chat_id, updateData) => {
  const { status, closed_by, last_message } = updateData;
  
  // Construir la consulta dinámicamente
  let query = 'UPDATE agent_chats SET updated_at = NOW()';
  const values = [];
  let valueIndex = 1;
  
  if (status !== undefined) {
    query += `, status = $${valueIndex}`;
    values.push(status);
    valueIndex++;
  }
  
  if (closed_by !== undefined) {
    query += `, closed_by = $${valueIndex}`;
    values.push(closed_by);
    valueIndex++;
  }
  
  if (last_message !== undefined) {
    query += `, last_message = $${valueIndex}`;
    values.push(last_message);
    valueIndex++;
  }
  
  query += ` WHERE id = $${valueIndex} RETURNING *`;
  values.push(chat_id);
  
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Chat no encontrado');
    }
    return formatDatesInData(result.rows[0], ['created_at', 'updated_at']);
  } catch (error) {
    console.error('Error al actualizar chat:', error);
    throw error;
  }
};

/**
 * Crea un nuevo mensaje en un chat
 * @param {Object} messageData - Datos del mensaje
 * @returns {Promise<Object>} - Mensaje creado
 */
const createMessage = async (messageData) => {
  const { chat_id, sender_id, sender_type, message, status } = messageData;
  
  const query = `
    INSERT INTO agent_chat_messages (
      chat_id,
      sender_id,
      sender_type,
      message,
      status,
      sent_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  
  const values = [chat_id, sender_id, sender_type, message, status || 'SENT'];
  
  try {
    const result = await pool.query(query, values);
    return formatDatesInData(result.rows[0], ['sent_at']);
  } catch (error) {
    console.error('Error al crear mensaje:', error);
    throw error;
  }
};

/**
 * Busca los mensajes de un chat
 * @param {number} chat_id - ID del chat
 * @returns {Promise<Array>} - Lista de mensajes
 */
const findMessagesByChatId = async (chat_id) => {
  const query = `
    SELECT * FROM agent_chat_messages
    WHERE chat_id = $1
    ORDER BY sent_at ASC
  `;
  
  try {
    const result = await pool.query(query, [chat_id]);
    return result.rows.map(row => formatDatesInData(row, ['sent_at']));
  } catch (error) {
    console.error('Error al buscar mensajes del chat:', error);
    throw error;
  }
};

/**
 * Obtiene el último mensaje de un chat
 * @param {number} chat_id - ID del chat
 * @returns {Promise<Object|null>} - Último mensaje o null
 */
const getLastMessageFromChat = async (chat_id) => {
  const query = `
    SELECT * FROM agent_chat_messages
    WHERE chat_id = $1
    ORDER BY sent_at DESC
    LIMIT 1
  `;
  
  try {
    const result = await pool.query(query, [chat_id]);
    if (result.rows.length === 0) {
      return null;
    }
    return formatDatesInData(result.rows[0], ['sent_at']);
  } catch (error) {
    console.error('Error al obtener último mensaje:', error);
    throw error;
  }
};

/**
 * Encuentra usuarios en línea
 * @returns {Promise<Array>} - Lista de usuarios en línea
 */
const findOnlineUsers = async () => {
  const query = `
    SELECT id, first_name, last_name, email, phone, online_status, last_seen
    FROM users
    WHERE online_status = true
    ORDER BY last_seen DESC
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows.map(row => formatDatesInData(row, ['last_seen']));
  } catch (error) {
    console.error('Error al buscar usuarios en línea:', error);
    throw error;
  }
};

/**
 * Marca un mensaje como leído
 * @param {number} message_id - ID del mensaje
 * @param {string} status - Nuevo estado
 * @returns {Promise<Object>} - Mensaje actualizado
 */
const updateMessageStatus = async (message_id, status) => {
  const query = `
    UPDATE agent_chat_messages
    SET status = $1
    WHERE id = $2
    RETURNING *
  `;
  
  try {
    const result = await pool.query(query, [status, message_id]);
    if (result.rows.length === 0) {
      throw new Error('Mensaje no encontrado');
    }
    return formatDatesInData(result.rows[0], ['sent_at']);
  } catch (error) {
    console.error('Error al actualizar estado del mensaje:', error);
    throw error;
  }
};

module.exports = {
  createChat,
  findChatById,
  findChatsByAgentId,
  findChatsByUserId,
  findActiveChatBetweenAgentAndUser,
  updateChat,
  createMessage,
  findMessagesByChatId,
  getLastMessageFromChat,
  findOnlineUsers,
  updateMessageStatus
};