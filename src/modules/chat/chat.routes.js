// routes/chat.routes.js
const express = require('express');
const {
    sendMessageController,
    fetchChatMessagesController,
    fetchUserChatsController,
    closeChatController,
    reopenChatController,
    assignAgentToChatController,
    createChatController
} = require('./chat.controller');
const validate = require('../../middlewares/validate.middleware');
const { chatSchema, messageSchema } = require('./chat.validation');

const router = express.Router();

// Rutas específicas deben ir primero
router.post('/create', validate(chatSchema), createChatController);
router.post('/send', validate(messageSchema), sendMessageController);
router.get('/messages/:chat_id', fetchChatMessagesController);
router.get('/user/:user_id', fetchUserChatsController);
router.put('/close/:chat_id', closeChatController);
router.put('/reopen/:chat_id', reopenChatController);
router.post('/assign-agent', assignAgentToChatController);

module.exports = router;