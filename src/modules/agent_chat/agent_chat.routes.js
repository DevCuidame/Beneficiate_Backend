// src/modules/agent_chat/agent_chat.routes.js
const express = require('express');
const router = express.Router();
const {
  initiateChat,
  getAgentChats,
  getOnlineUsers,
  getChatMessages,
  closeChat,
  sendMessage,
  getUserChats
} = require('./agent_chat.controller');
const authenticate = require('../../middlewares/auth.middleware');
const { isAgent } = require('../../middlewares/agent_chat.middleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Rutas para agentes (requieren middleware isAgent)
router.post('/initiate', isAgent, initiateChat);
router.get('/agent/:agent_id', isAgent, getAgentChats);
router.get('/online-users', isAgent, getOnlineUsers);

// Rutas generales (accesibles por agentes y usuarios regulares)
router.get('/user/:user_id',  getUserChats);
router.get('/messages/:chat_id', getChatMessages);
router.post('/send-message', sendMessage);
router.post('/close', closeChat);

module.exports = router;