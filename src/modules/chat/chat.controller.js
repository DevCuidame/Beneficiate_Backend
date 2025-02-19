// controllers/chat.controller.js
const chatService = require('./chat.service');
const { successResponse, errorResponse } = require('../../core/responses');

const createChatController = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;
    const result = await chatService.createChat(sender_id, receiver_id);
    successResponse(res, result, 'Chat creado exitosamente');
  } catch (error) {
    console.log("🚀 ~ createChatController ~ error:", error)
    errorResponse(res, error);
  }
};

const sendMessageController = async (req, res) => {
  try {
    const { chat_id, sender_id, sender_type, message } = req.body;
    const result = await chatService.sendMessage(
      chat_id,
      sender_id,
      sender_type,
      message
    );
    successResponse(res, result, 'Mensaje enviado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const fetchChatMessagesController = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const result = await chatService.fetchChatMessages(chat_id);
    successResponse(res, result, 'Mensajes obtenidos correctamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const fetchUserChatsController = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await chatService.fetchUserChats(user_id);
    successResponse(res, result, 'Chats obtenidos correctamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const closeChatController = async (req, res) => {
  try {
    const { chat_id, closed_by } = req.body;
    const result = await chatService.closeChatService(chat_id, closed_by);
    successResponse(res, result, 'Chat cerrado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const reopenChatController = async (req, res) => {
  try {
    const { chat_id } = req.body;
    const result = await chatService.reopenChatService(chat_id);
    successResponse(res, result, 'Chat reabierto exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const assignAgentToChatController = async (req, res) => {
  try {
    const { chat_id } = req.body;
    const result = await chatService.assignAgentToChatService(chat_id);
    successResponse(res, result, 'Agente asignado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  sendMessageController,
  fetchChatMessagesController,
  fetchUserChatsController,
  closeChatController,
  reopenChatController,
  assignAgentToChatController,
  createChatController
};
