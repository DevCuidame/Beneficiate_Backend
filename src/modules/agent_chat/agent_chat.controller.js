// src/modules/agent_chat/agent_chat.controller.js
const agentChatService = require('./agent_chat.service');
const { successResponse, errorResponse } = require('../../core/responses');

/**
 * Inicia un nuevo chat entre un agente y un usuario
 */
const initiateChat = async (req, res) => {
  try {
    const { agent_id, user_id } = req.body;
    console.log("🚀 ~ initiateChat ~ req.body:", req.body)
    
    // Validar que el agente y el usuario existen
    if (!agent_id || !user_id) {
      return errorResponse(res, { 
        message: 'Se requieren agent_id y user_id', 
        statusCode: 400 
      });
    }

    // Iniciar el chat y obtener información
    const chatData = await agentChatService.initiateChat(agent_id, user_id);
    
    successResponse(res, chatData, 'Chat iniciado exitosamente');
  } catch (error) {
    console.error('Error al iniciar chat:', error);
    errorResponse(res, error);
  }
};

/**
 * Obtiene la lista de chats activos para un agente
 */
const getAgentChats = async (req, res) => {
  try {
    const { agent_id } = req.params;
    
    if (!agent_id) {
      return errorResponse(res, { 
        message: 'Se requiere agent_id', 
        statusCode: 400 
      });
    }

    const chats = await agentChatService.getAgentChats(agent_id);
    successResponse(res, chats, 'Chats recuperados exitosamente');
  } catch (error) {
    console.error('Error al obtener chats del agente:', error);
    errorResponse(res, error);
  }
};

/**
 * Obtiene la lista de chats activos para un usuario
 */
const getUserChats = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (!user_id) {
      return errorResponse(res, { 
        message: 'Se requiere user_id', 
        statusCode: 400 
      });
    }

    const chats = await agentChatService.getUserChats(user_id);
    successResponse(res, chats, 'Chats recuperados exitosamente');
  } catch (error) {
    console.error('Error al obtener chats del agente:', error);
    errorResponse(res, error);
  }
};

/**
 * Obtiene todos los usuarios en línea disponibles para chatear
 */
const getOnlineUsers = async (req, res) => {
  try {
    const users = await agentChatService.getOnlineUsers();
    successResponse(res, users, 'Usuarios en línea recuperados exitosamente');
  } catch (error) {
    console.error('Error al obtener usuarios en línea:', error);
    errorResponse(res, error);
  }
};

/**
 * Obtiene los mensajes de un chat específico
 */
const getChatMessages = async (req, res) => {
  try {
    const { chat_id } = req.params;
    
    if (!chat_id) {
      return errorResponse(res, { 
        message: 'Se requiere chat_id', 
        statusCode: 400 
      });
    }

    const messages = await agentChatService.getChatMessages(chat_id);
    successResponse(res, messages, 'Mensajes recuperados exitosamente');
  } catch (error) {
    console.error('Error al obtener mensajes del chat:', error);
    errorResponse(res, error);
  }
};

/**
 * Cierra un chat activo
 */
const closeChat = async (req, res) => {
  try {
    const { chat_id, closed_by } = req.body;
    
    if (!chat_id || !closed_by) {
      return errorResponse(res, { 
        message: 'Se requieren chat_id y closed_by', 
        statusCode: 400 
      });
    }

    const result = await agentChatService.closeChat(chat_id, closed_by);
    successResponse(res, result, 'Chat cerrado exitosamente');
  } catch (error) {
    console.error('Error al cerrar chat:', error);
    errorResponse(res, error);
  }
};

/**
 * Envía un mensaje en un chat
 */
const sendMessage = async (req, res) => {
  try {
    const { chat_id, sender_id, sender_type, message } = req.body;
    
    if (!chat_id || !sender_id || !sender_type || !message) {
      return errorResponse(res, { 
        message: 'Se requieren chat_id, sender_id, sender_type y message', 
        statusCode: 400 
      });
    }

    const result = await agentChatService.sendMessage(chat_id, sender_id, sender_type, message);
    successResponse(res, result, 'Mensaje enviado exitosamente');
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    errorResponse(res, error);
  }
};

module.exports = {
  initiateChat,
  getAgentChats,
  getOnlineUsers,
  getChatMessages,
  closeChat,
  sendMessage,
  getUserChats
};