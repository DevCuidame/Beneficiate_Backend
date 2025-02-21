// services/chat.service.js
const chatRepository = require('./chat.repository');

const sendMessage = async (chat_id, sender_id, sender_type, message, status) => {
    return await chatRepository.createMessage(chat_id, sender_id, sender_type, message, status);
};

const fetchChatMessages = async (chat_id) => {
    return await chatRepository.getChatMessages(chat_id);
};

const fetchChatParticipants = async (chat_id) => {
    return await chatRepository.fetchChatParticipants(chat_id);
};

const fetchUserChats = async (user_id) => {
    return await chatRepository.getUserChats(user_id);
};

const closeChatService = async (chat_id, closed_by) => {
    return await chatRepository.closeChat(chat_id, closed_by);
};

const reopenChatService = async (chat_id) => {
    return await chatRepository.reopenChat(chat_id);
};

const assignAgentToChatService = async (chat_id) => {
    return await chatRepository.assignAgentToChat(chat_id);
};

const createChat = async (sender_id, receiver_id) => {
    return await chatRepository.createChat(sender_id, receiver_id);
};

module.exports = {
    sendMessage,
    fetchChatMessages,
    fetchUserChats,
    closeChatService,
    reopenChatService,
    assignAgentToChatService,
    createChat,
    fetchChatParticipants
};
