// repositories/chat.repository.js
const pool = require('../../config/connection');

const createMessage = async (chat_id, sender_id, sender_type, message) => {
    const result = await pool.query(
        'INSERT INTO messages (chat_id, sender_id, sender_type, message) VALUES ($1, $2, $3, $4) RETURNING *',
        [chat_id, sender_id, sender_type, message]
    );
    
    await pool.query(
        'UPDATE chats SET updated_at = NOW(), last_message = $1 WHERE id = $2',
        [message, chat_id]
    );
    
    return result.rows[0];
};

const getChatMessages = async (chat_id) => {
    const result = await pool.query(
        'SELECT * FROM messages WHERE chat_id = $1 ORDER BY sent_at ASC',
        [chat_id]
    );
    return result.rows;
};

const getUserChats = async (user_id) => {
    const result = await pool.query(
        'SELECT id, sender_id, receiver_id, status, last_message, created_at, updated_at FROM chats WHERE sender_id = $1 OR receiver_id = $1 ORDER BY updated_at DESC',
        [user_id]
    );
    return result.rows;
};

const closeChat = async (chat_id, closed_by) => {
    await pool.query(
        'UPDATE chats SET status = $1, closed_by = $2, updated_at = NOW() WHERE id = $3',
        ['CLOSED', closed_by, chat_id]
    );
    return { message: 'Chat cerrado exitosamente' };
};

const reopenChat = async (chat_id) => {
    await pool.query(
        'UPDATE chats SET status = $1, closed_by = NULL, updated_at = NOW() WHERE id = $2',
        ['ACTIVE', chat_id]
    );
    return { message: 'Chat reabierto exitosamente' };
};

const assignAgentToChat = async (chat_id) => {
    const availableAgents = await getAvailableAgents();
    if (availableAgents.length === 0) {
        return { message: 'No hay agentes disponibles en este momento' };
    }
    
    const assignedAgent = availableAgents.reduce((prev, curr) => (prev.active_chats < curr.active_chats ? prev : curr));
    
    await pool.query(
        'UPDATE chats SET receiver_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [assignedAgent.id, 'ACTIVE', chat_id]
    );
    
    return { message: 'Agente asignado exitosamente', agent: assignedAgent };
};

const getAvailableAgents = async () => {
    const result = await pool.query(
        `SELECT ca.id, COUNT(c.id) AS active_chats 
         FROM call_center_agents ca 
         LEFT JOIN chats c ON ca.id = c.receiver_id AND c.status = 'ACTIVE' 
         WHERE ca.status = $1 
         GROUP BY ca.id 
         ORDER BY active_chats ASC`,
        ['ACTIVE']
    );
    return result.rows;
};


const fetchChatParticipants = async (chat_id) => {
    const result = await pool.query(
        'SELECT sender_id, receiver_id FROM chats WHERE id = $1', 
        [chat_id]
    );
    if (result.rows.length > 0) {
        return [result.rows[0].sender_id, result.rows[0].receiver_id];
    }
    return [];
};


const createChat = async (sender_id, receiver_id) => {
    const result = await pool.query(
        'INSERT INTO chats (sender_id, receiver_id) VALUES ($1, $2) RETURNING *',
        [sender_id, receiver_id]
    );
    return result.rows[0];
};

module.exports = { createMessage, getChatMessages, getUserChats, closeChat, reopenChat, getAvailableAgents, assignAgentToChat, createChat, fetchChatParticipants };
