// src/modules/websocket/websocket.js
const WebSocket = require('ws');
const jwt = require('../../utils/jwt');
const userRepository = require('../users/user.repository');
const userService = require('../users/user.service');
const websocketEvents = require('./websocket-events');
const chatService = require('../chat/chat.service');
const appointmentService = require('../appointment/appointment.service');
const chatbotFlow = require('./chatbotFlow');
const agentChatService = require('../agent_chat/agent_chat.service');
const callCenterAgentService = require('../call_center_agents/call_center_agents.service');
const url = require('url');

const clients = new Map();
const onlineUsers = new Set();
const agentClients = new Map();

const initializeWebSocket = (server, wsPath = '/ws') => {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    // Verificar que la ruta sea la correcta
    const pathname = url.parse(request.url).pathname;
    
    if (pathname !== wsPath) {
      socket.destroy();
      return;
    }

    let token = request.headers['sec-websocket-protocol'];
    if (!token) {
      socket.destroy();
      return;
    }
    token = token.split(', ')[1] || token;
    
    try {
      const decodedToken = jwt.verifyToken(token, process.env.JWT_SECRET);
      if (!decodedToken || !decodedToken.id) {
        socket.destroy();
        return;
      }

      // Obtener datos actualizados del usuario desde la base de datos
      const userData = await userService.getUserById(decodedToken.id);
      if (!userData) {
        console.error(`Usuario no encontrado en BD: ${decodedToken.id}`);
        socket.destroy();
        return;
      }

      // Verificar si el usuario es un agente y si está activo
      let isAgent = false;
      let agentData = null;
      let agentActive = false;

      try {
        // Intentar obtener datos del agente si existe
        agentData = await callCenterAgentService.getCallCenterAgentByUserId(
          userData.id
        );
        if (agentData) {
          isAgent = true;
          agentActive = agentData.status === 'ACTIVE';
        }
      } catch (agentError) {
        // Si hay error al buscar el agente, asumimos que no es un agente
        console.log(
          `Usuario ${userData.id} no es un agente o hubo un error al verificar`
        );
      }

      // Verificar si el usuario tiene un plan activo SOLO si NO es un agente
      if (!isAgent && !userData.plan) {
        console.log(`Usuario ${userData.id} no tiene un plan activo`);
        // En lugar de destruir el socket, podemos actualizarlo para mostrar un mensaje claro
        request.userWithoutPlan = true;
        wss.handleUpgrade(request, socket, head, (ws) => {
          ws.userWithoutPlan = true;
          wss.emit('connection', ws, request);
        });
        return;
      }

      const user = {
        ...userData,
        isAgent,
        agentActive,
        agentId: agentData?.id || null,
      };

      request.user = user;
      wss.handleUpgrade(request, socket, head, (ws) => {
        ws.user = user;
        wss.emit('connection', ws, request);
      });
    } catch (error) {
      socket.destroy();
    }
  });

  wss.on('connection', async (ws, req) => {
    const user = req.user;

    if (!user) {
      ws.close();
      return;
    }
    try {
      ws.user = user;
      let isAgent = false;

      // Verificar si el usuario es un agente de call center
      if (user.isAgent) {
        try {
          const agent =
            user.agentData ||
            (await callCenterAgentService.getCallCenterAgentById(user.agentId));
          ws.agent = agent;

          if (agent && agent.status === 'ACTIVE') {
            isAgent = true;
            ws.agent = agent;

            const existingConnection = agentClients.get(agent.id);
            if (existingConnection && existingConnection !== ws) {
              existingConnection.close();
            }

            agentClients.set(agent.id, ws);

            // Notificar al agente de su estado
            ws.send(
              JSON.stringify({
                event: 'agent_connected',
                agent: {
                  id: agent.id,
                  status: agent.status,
                  agent_code: agent.agent_code,
                },
              })
            );

            // Enviar lista de chats activos al agente
            const agentChats = await agentChatService.getAgentChats(agent.id);
            ws.send(
              JSON.stringify({
                event: 'agent_chats',
                chats: agentChats,
              })
            );

            // Enviar lista de usuarios en línea
            const onlineUsersList = await agentChatService.getOnlineUsers();
            ws.send(
              JSON.stringify({
                event: 'online_users',
                users: onlineUsersList,
              })
            );

            try {
              const appointments =
                await appointmentService.getAllAppointments();
              ws.send(
                JSON.stringify({
                  event: 'all_appointments',
                  appointments,
                })
              );
              ws.botState = null;
            } catch (appointmentError) {
              console.error('Error obteniendo citas:', appointmentError);
            }
          }
        } catch (agentError) {
          console.error('Error verificando estado de agente:', agentError);
        }
      }

      // Si no es agente, es un cliente regular
      if (!isAgent) {
        // Si ya existe una conexión para este usuario, cerrarla
        const existingConnection = clients.get(user.id);
        if (existingConnection && existingConnection !== ws) {
          existingConnection.close();
        }

        clients.set(user.id, ws);
      }

      // Actualizar estado en línea
      onlineUsers.add(user.id);
      await userRepository.updateUserStatus(user.id, true);

      // Notificar conexión a todos
      notifyUserConnection(user.id);
      broadcastOnlineUsers();

      // Enviar eventos según el tipo de usuario
      if (!isAgent) {
        // Para clientes regulares
        sendUserAppointments(user.id, ws);

        // Verificar si tiene chats activos con agentes
        try {
          const userChats = await agentChatService.findChatsByUserId(user.id);
          if (userChats && userChats.length > 0) {
            ws.send(
              JSON.stringify({
                event: 'user_chats',
                chats: userChats,
              })
            );
          }
        } catch (chatsError) {
          console.error('Error obteniendo chats del usuario:', chatsError);
        }
      }

      // Código para chatbot o citas
      if (user.isAgent) {
        try {
          const appointments = await appointmentService.getAllAppointments();
          ws.send(
            JSON.stringify({
              event: 'all_appointments',
              appointments,
            })
          );
          ws.botState = null;
        } catch (appointmentError) {
          console.error('Error obteniendo citas:', appointmentError);
        }
      } else {
        ws.botState = chatbotFlow.STATES.AWAITING_DOCUMENT;
        const welcomeMsg = {
          event: 'chatbot_message',
          message:
            'Bienvenido al chat de citas. Para empezar, por favor ingresa el documento de identidad de la persona que necesita la cita, sin espacios ni puntos.',
          sender_type: 'BOT',
        };
        ws.send(JSON.stringify(welcomeMsg));
      }
    } catch (error) {
      console.error('Error en la conexión:', error);
      ws.close();
      return;
    }

    // Handle message event
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.source === 'chatbot') {
          await chatbotFlow.handleChatbotFlow(ws, data);
          return;
        }

        // Handle different message types based on the event
        switch (data.event) {
          case 'chatbot_init':
            ws.professionalId = data.professionalId;
            await chatbotFlow.handleChatbotFlow(ws, {
              event: 'init',
              professionalId: data.professionalId,
            });
            break;

          case 'chat_message':
            await handleMessage(ws, data);
            break;
          case 'agent_chat_message':
            await handleAgentChatMessage(ws, data);
            break;
          case 'initiate_chat':
            await handleInitiateAgentChat(ws, data);
            break;
          case 'message_read':
            await handleMessageRead(data.chat_id, ws.user.id, data.message_id);
            break;
          case 'typing':
            notifyTyping(data.chat_id, ws.user.id);
            break;
          case 'stop_typing':
            notifyStopTyping(data.chat_id, ws.user.id);
            break;
          // Add other message types as needed
          case 'close_chat':
            await handleCloseChat(ws, data);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
        ws.send(JSON.stringify({ error: 'Error al procesar el mensaje' }));
      }
    });

    // Handle disconnect
    ws.on('close', async () => {
      try {
        const userId = ws.user.id;

        // If agent, remove from agent clients
        if (ws.agent) {
          agentClients.delete(ws.agent.id);
        } else {
          // Remove from clients map
          clients.delete(userId);
        }

        // Update online status only if the user is not connected through another socket
        if (!clients.has(userId)) {
          onlineUsers.delete(userId);
          await userRepository.updateUserStatus(userId, false);
          notifyUserDisconnection(userId);
          broadcastOnlineUsers();
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  // Register event handlers through the event bus
  websocketEvents.on('broadcastMessage', broadcastMessage);
  websocketEvents.on('broadcastAppointment', broadcastAppointment);
  websocketEvents.on('sendUserAppointments', sendUserAppointments);

  return wss;
};

const handleMessage = async (ws, data) => {
  try {
    if (!data.chat_id || !data.sender_id || !data.message) {
      ws.send(
        JSON.stringify({ error: 'Datos incompletos para enviar el mensaje' })
      );
      return;
    }
    const savedMessage = await chatService.sendMessage(
      data.chat_id,
      data.sender_id,
      data.sender_type,
      data.message,
      data.status
    );
    broadcastMessage(data.chat_id, savedMessage);
    notifyNewMessage(data.chat_id, savedMessage);
  } catch (error) {
    console.error('Error al manejar el mensaje:', error);
    ws.send(JSON.stringify({ error: 'Error interno al enviar el mensaje' }));
  }
};

const handleMessageRead = async (chat_id, user_id, message_id) => {
  await chatService.markMessageAsRead(message_id, user_id);
  notifyMessageRead(chat_id, user_id, message_id);
};

const notifyUserStatusChange = async (user_id, status) => {
  if (!user_id) return;
  const chatParticipants = await chatService.fetchUserChatParticipants(user_id);
  chatParticipants.forEach((participant_id) => {
    const client = clients.get(participant_id);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event: 'user_status', user_id, status }));
    }
  });
};

const notifyNewMessage = (chat_id, message) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event: 'new_message', chat_id, message }));
    }
  });
};

/**
 * Maneja el envío de mensajes en chats de agente
 */
/**
 * Maneja el envío de mensajes en chats de agente
 */
const handleAgentChatMessage = async (ws, data) => {
  try {
    const { chat_id, message } = data;
    if (!chat_id || !message) {
      ws.send(
        JSON.stringify({
          event: 'error',
          message: 'Se requieren chat_id y message',
        })
      );
      return;
    }

    const sender_id = ws.agent ? ws.agent.id : ws.user.id;
    const sender_type = ws.agent ? 'AGENT' : 'USER';

    // Enviar mensaje mediante el servicio
    const sentMessage = await agentChatService.sendMessage(
      chat_id,
      sender_id,
      sender_type,
      message
    );

    // Si no hay mensaje devuelto por el servicio, crea uno para mantener consistencia
    const messageObject = sentMessage || {
      id: Date.now(),
      chat_id: chat_id,
      sender_id: sender_id,
      sender_type: sender_type,
      message: message,
      sent_at: new Date().toISOString(),
      status: 'SENT',
    };

    // Crear un payload consistente que incluya todos los datos necesarios
    const messagePayload = {
      event: sender_type === 'USER' ? 'user_message' : 'agent_chat_message',
      chat_id: chat_id,
      message: messageObject,
    };

    // Get the chat to find both participants
    const chat = await agentChatService.findChatById(chat_id);
    if (chat) {
      // Send to user
      const userClient = clients.get(chat.user_id);
      if (userClient && userClient.readyState === WebSocket.OPEN) {
        userClient.send(JSON.stringify(messagePayload));
      }

      // Send to agent
      const agentClient = agentClients.get(chat.agent_id);
      if (agentClient && agentClient.readyState === WebSocket.OPEN) {
        agentClient.send(JSON.stringify(messagePayload));
      }
    }
  } catch (error) {
    console.error('Error enviando mensaje de chat de agente:', error);
    ws.send(
      JSON.stringify({
        event: 'error',
        message: 'Error al enviar el mensaje: ' + error.message,
      })
    );
  }
};

/**
 * Maneja la iniciación de un chat de agente
 */
const handleInitiateAgentChat = async (ws, data) => {
  try {
    const { user_id } = data;
    if (!ws.agent || !user_id) {
      ws.send(
        JSON.stringify({
          event: 'error',
          message: 'No autorizado o falta user_id',
        })
      );
      return;
    }

    // Iniciar chat mediante el servicio
    const chat = await agentChatService.initiateChat(ws.agent.id, user_id);
    const user = await userRepository.getUserById(user_id);
    const agent = await callCenterAgentService.getCallCenterAgentById(
      ws.agent.id
    );

    const enrichedChat = {
      ...chat,
      user: user || {
        id: user_id,
        first_name: 'Usuario',
        last_name: '',
        email: '',
      },
      agent: agent || {
        id: ws.agent.id,
        agent_code: 'AG' + ws.agent.id,
        status: 'ACTIVE',
      },
    };

    // Notificar al agente
    ws.send(
      JSON.stringify({
        event: 'chat_initiated',
        chat: enrichedChat,
      })
    );

    // Notificar al usuario si está conectado
    const userClient = clients.get(user_id);
    if (userClient && userClient.readyState === WebSocket.OPEN) {
      userClient.send(
        JSON.stringify({
          event: 'new_chat',
          chat: enrichedChat,
        })
      );
    }
  } catch (error) {
    console.error('Error iniciando chat de agente:', error);
    ws.send(
      JSON.stringify({
        event: 'error',
        message: 'Error al iniciar el chat',
      })
    );
  }
};

// This is now the function that gets called by the event bus
const broadcastMessage = async (chat_id, message) => {
  try {
    // Get chat through repository or service without creating circular dependency
    const chat = await agentChatService.findChatById(chat_id);
    if (!chat) {
      console.warn(
        `Intento de difundir mensaje a chat inexistente: ${chat_id}`
      );
      return;
    }

    // Asegurarse de que tenemos un objeto message completo
    const messageObject =
      typeof message === 'string'
        ? {
            id: Date.now(),
            chat_id: chat_id,
            message: message,
            sender_type: 'SYSTEM',
            sent_at: new Date().toISOString(),
          }
        : message;

    // Determinar el tipo de evento basado en el remitente
    const eventType =
      messageObject.sender_type === 'USER'
        ? 'user_message'
        : messageObject.sender_type === 'AGENT'
        ? 'agent_chat_message'
        : 'new_message';

    const eventPayload = {
      event: eventType,
      chat_id: chat_id,
      message: messageObject,
    };

    // Enviar al usuario
    const userClient = clients.get(chat.user_id);
    if (userClient && userClient.readyState === WebSocket.OPEN) {
      userClient.send(JSON.stringify(eventPayload));
    }

    // Enviar al agente
    const agentClient = agentClients.get(chat.agent_id);
    if (agentClient && agentClient.readyState === WebSocket.OPEN) {
      agentClient.send(JSON.stringify(eventPayload));
    }
  } catch (error) {
    console.error(`Error difundiendo mensaje al chat ${chat_id}:`, error);
  }
};

// Primero agrega esta función junto a las otras funciones de manejo de eventos
/**
 * Maneja el cierre de un chat
 * @param {WebSocket} ws - Conexión WebSocket
 * @param {Object} data - Datos recibidos
 */

const handleCloseChat = async (ws, data) => {
  if (!data.chat_id || !data.closed_by) {
    ws.send(
      JSON.stringify({
        event: 'error',
        message: 'Se requieren chat_id y closed_by',
      })
    );
    return;
  }

  try {
    const result = await agentChatService.closeChat(
      data.chat_id,
      data.closed_by
    );
  } catch (error) {
    console.error('Error al cerrar chat:', error);
    ws.send(
      JSON.stringify({
        event: 'error',
        message: 'Error al cerrar el chat: ' + error.message,
      })
    );
  }
};

const notifyTyping = (chat_id, user_id) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event: 'typing', chat_id, user_id }));
    }
  });
};

const notifyStopTyping = (chat_id, user_id) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event: 'stop_typing', chat_id, user_id }));
    }
  });
};

const notifyMessageRead = (chat_id, user_id, message_id) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ event: 'message_read', chat_id, user_id, message_id })
      );
    }
  });
};

const notifyUserConnection = (user_id) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event: 'user_connected', user_id }));
    }
  });
};

const notifyUserDisconnection = (user_id) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event: 'user_disconnected', user_id }));
    }
  });
};

const broadcastOnlineUsers = () => {
  const onlineUserList = Array.from(onlineUsers);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({ event: 'online_users', users: onlineUserList })
      );
    }
  });
};

const broadcastAppointment = async (appointment) => {
  const enrichedAppointment = await appointmentService.getAppointmentById(
    appointment.id
  );
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          event: 'new_appointment',
          appointment: enrichedAppointment,
        })
      );
    }
  });
};

const sendUserAppointments = async (user_id) => {
  const userAppointments = await appointmentService.getAppointmentsByUserId(
    user_id
  );
  const userSocket = clients.get(user_id);

  if (userSocket && userSocket.readyState === WebSocket.OPEN) {
    userSocket.send(
      JSON.stringify({
        event: 'user_appointments',
        appointments: userAppointments,
      })
    );
  }
};

module.exports = {
  initializeWebSocket,
  clients,
  agentClients,
  onlineUsers,
  broadcastAppointment,
};
