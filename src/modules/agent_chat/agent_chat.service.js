// src/modules/agent_chat/agent_chat.service.js
const agentChatRepository = require('./agent_chat.repository');
const userService = require('../users/user.service');
const callCenterAgentService = require('../call_center_agents/call_center_agents.service');
const { NotFoundError, ValidationError } = require('../../core/errors');
// Import the event bus instead of the websocket module directly
const websocketEvents = require('../websocket/websocket-events');

/**
 * Inicia un nuevo chat entre un agente y un usuario
 * @param {number} agent_id - ID del agente
 * @param {number} user_id - ID del usuario
 * @returns {Promise<Object>} - Datos del chat creado
 */
const initiateChat = async (agent_id, user_id) => {
  try {

    // Validar que el agente existe
    const agent = await callCenterAgentService.getCallCenterAgentById(agent_id);
    if (!agent) {
      throw new NotFoundError('Agente no encontrado');
    }
    console.log(user_id);
    // Validar que el usuario existe
    const user = await userService.getUserById(user_id);
    console.log('🚀 ~ initiateChat ~ user:', user);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar si ya existe un chat activo entre el agente y el usuario
    const existingChat =
      await agentChatRepository.findActiveChatBetweenAgentAndUser(
        agent_id,
        user_id
      );
    if (existingChat) {
      return existingChat;
    }

    // Crear un nuevo chat
    const newChat = await agentChatRepository.createChat({
      agent_id,
      user_id,
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Enviar mensaje de bienvenida automático
    const welcomeMessage = await agentChatRepository.createMessage({
      chat_id: newChat.id,
      sender_id: agent_id,
      sender_type: 'SYSTEM',
      message: `Bienvenido al chat de asistencia. Un agente le atenderá en breve.`,
      status: 'SENT',
      sent_at: new Date(),
    });

    // Notificar al usuario sobre el nuevo chat mediante websocket
    broadcastChatEvent('new_chat', {
      chat_id: newChat.id,
      chat: newChat,
      message: welcomeMessage,
    });

    return {
      ...newChat,
      welcome_message: welcomeMessage,
    };
  } catch (error) {
    console.error('Error al iniciar chat:', error);
    throw error;
  }
  console.log('🚀 ~ initiateChat ~ AS:', AS);
};

/**
 * Obtiene la lista de chats activos para un agente
 * @param {number} agent_id - ID del agente
 * @returns {Promise<Array>} - Lista de chats
 */
const getAgentChats = async (agent_id) => {
  try {
    const chats = await agentChatRepository.findChatsByAgentId(agent_id);

    // Enriquecer los datos de cada chat con información del usuario
    const enrichedChats = await Promise.all(
      chats.map(async (chat) => {
        const user = await userService.getUserById(chat.user_id);
        const lastMessage = await agentChatRepository.getLastMessageFromChat(
          chat.id
        );

        return {
          ...chat,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
          },
          last_message: lastMessage,
        };
      })
    );

    return enrichedChats;
  } catch (error) {
    console.error('Error al obtener chats del agente:', error);
    throw error;
  }
};

const getUserChats = async (user_id) => {
  try {
    const chats = await agentChatRepository.findChatsByUserId(user_id);

    // Enriquecer los datos de cada chat con información del usuario
    const enrichedChats = await Promise.all(
      chats.map(async (chat) => {
        const user = await userService.getUserById(chat.user_id);
        const lastMessage = await agentChatRepository.getLastMessageFromChat(
          chat.id
        );

        return {
          ...chat,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
          },
          last_message: lastMessage,
        };
      })
    );

    return enrichedChats;
  } catch (error) {
    console.error('Error al obtener chats del agente:', error);
    throw error;
  }
};

/**
 * Finds a chat by its ID
 * @param {number} chat_id - ID of the chat to find
 * @returns {Promise<Object>} - Chat data
 */
const findChatById = async (chat_id) => {
  try {
    const chat = await agentChatRepository.findChatById(chat_id);
    return chat;
  } catch (error) {
    console.error('Error finding chat by ID:', error);
    throw error;
  }
};

/**
 * Find chats by user ID
 * @param {number} user_id - ID of the user
 * @returns {Promise<Array>} - List of chats
 */
const findChatsByUserId = async (user_id) => {
  try {
    const chats = await agentChatRepository.findChatsByUserId(user_id);
    return chats;
  } catch (error) {
    console.error('Error finding chats by user ID:', error);
    throw error;
  }
};

/**
 * Obtiene todos los usuarios en línea disponibles para chatear
 * @returns {Promise<Array>} - Lista de usuarios en línea
 */
const getOnlineUsers = async () => {
  try {
    const onlineUsers = await agentChatRepository.findOnlineUsers();

    // Filtrar solo la información necesaria de los usuarios
    const filteredUsers = onlineUsers.map((user) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      online_status: user.online_status,
      last_seen: user.last_seen,
    }));

    return filteredUsers;
  } catch (error) {
    console.error('Error al obtener usuarios en línea:', error);
    throw error;
  }
};

/**
 * Obtiene los mensajes de un chat específico
 * @param {number} chat_id - ID del chat
 * @returns {Promise<Array>} - Lista de mensajes
 */
const getChatMessages = async (chat_id) => {
  try {
    const chat = await agentChatRepository.findChatById(chat_id);
    if (!chat) {
      throw new NotFoundError('Chat no encontrado');
    }

    const messages = await agentChatRepository.findMessagesByChatId(chat_id);
    return messages;
  } catch (error) {
    console.error('Error al obtener mensajes del chat:', error);
    throw error;
  }
};

/**
 * Cierra un chat activo
 * @param {number} chat_id - ID del chat
 * @param {number} closed_by - ID del usuario o agente que cierra el chat
 * @returns {Promise<Object>} - Resultado de la operación
 */
const closeChat = async (chat_id, closed_by) => {
  try {
    const chat = await agentChatRepository.findChatById(chat_id);
    if (!chat) {
      throw new NotFoundError('Chat no encontrado');
    }

    if (chat.status === 'CLOSED') {
      throw new ValidationError('El chat ya está cerrado');
    }

    // Actualizar estado del chat
    const updatedChat = await agentChatRepository.updateChat(chat_id, {
      status: 'CLOSED',
      closed_by,
      updated_at: new Date(),
    });

    // Agregar mensaje de sistema indicando que el chat ha sido cerrado
    const systemMessage = await agentChatRepository.createMessage({
      chat_id,
      sender_id: closed_by,
      sender_type: 'SYSTEM',
      message: 'Este chat ha sido cerrado',
      status: 'SENT',
      sent_at: new Date(),
    });

    // Notificar a los participantes del chat
    broadcastChatEvent('chat_closed', {
      chat_id,
      closed_by,
      message: systemMessage,
    });

    return {
      ...updatedChat,
      system_message: systemMessage,
    };
  } catch (error) {
    console.error('Error al cerrar chat:', error);
    throw error;
  }
};

/**
 * Envía un mensaje en un chat
 * @param {number} chat_id - ID del chat
 * @param {number} sender_id - ID del remitente
 * @param {string} sender_type - Tipo de remitente (USER o AGENT)
 * @param {string} message - Contenido del mensaje
 * @returns {Promise<Object>} - Mensaje enviado
 */
const sendMessage = async (chat_id, sender_id, sender_type, message) => {
  try {
    const chat = await agentChatRepository.findChatById(chat_id);
    if (!chat) {
      throw new NotFoundError('Chat no encontrado');
    }

    if (chat.status === 'CLOSED') {
      throw new ValidationError(
        'No se pueden enviar mensajes en un chat cerrado'
      );
    }

    // Validar que el remitente sea parte del chat
    if (sender_type === 'USER' && chat.user_id !== sender_id) {
      throw new ValidationError('El usuario no pertenece a este chat');
    } else if (sender_type === 'AGENT' && chat.agent_id !== sender_id) {
      throw new ValidationError('El agente no pertenece a este chat');
    }

    // Crear el mensaje
    const newMessage = await agentChatRepository.createMessage({
      chat_id,
      sender_id,
      sender_type,
      message,
      status: 'SENT',
      sent_at: new Date(),
    });

    // Actualizar la fecha de última actualización del chat
    await agentChatRepository.updateChat(chat_id, {
      updated_at: new Date(),
      last_message: message,
    });

    // Notificar a los participantes
    broadcastChatEvent('new_message', {
      chat_id,
      message: newMessage,
    });

    return newMessage;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw error;
  }
};

/**
 * Función para difundir eventos de chat a través de WebSockets
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
const broadcastChatEvent = (event, data) => {
  try {
    // Use the event bus to emit the broadcastMessage event
    websocketEvents.emit('broadcastMessage', data.chat_id, {
      event,
      ...data,
    });
  } catch (error) {
    console.error('Error al difundir evento de chat:', error);
  }
};

module.exports = {
  initiateChat,
  getAgentChats,
  getOnlineUsers,
  getChatMessages,
  closeChat,
  sendMessage,
  findChatById,
  findChatsByUserId,
  getUserChats
};
