const WebSocket = require('ws');
const chatService = require('../chat/chat.service');
const jwt = require('../../utils/jwt');
const userRepository = require('../users/user.repository');

const clients = new Map();
const onlineUsers = new Set();

const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    let token = request.headers['sec-websocket-protocol'];
    
    
    if (!token) {
        socket.destroy();
        return;
    }

    token = token.split(', ')[1] || token;

    try {
        const user = jwt.verifyToken(token, process.env.JWT_SECRET);
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
    if (!req.user) {
      ws.close();
      return;
    }

    try {
      const user = req.user;
      ws.user = user;
      clients.set(user.id, ws);
      onlineUsers.add(user.id);
      await userRepository.updateUserStatus(user.id, true);

      notifyUserConnection(user.id);
      broadcastOnlineUsers();
    } catch (error) {
      ws.close();
      return;
    }

    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      if (data.event === 'typing') {
        notifyTyping(data.chat_id, data.user_id);
      } else if (data.event === 'stop_typing') {
        notifyStopTyping(data.chat_id, data.user_id);
      } else if (data.event === 'message_read') {
        await handleMessageRead(data.chat_id, data.user_id, data.message_id);
      } else {
        await handleMessage(ws, data);
      }
    });

    ws.on('close', async () => {
      if (!ws.user) return;
      console.log(`❌ Cliente ${ws.user.id} desconectado`);
      clients.delete(ws.user.id);
      onlineUsers.delete(ws.user.id);
      await userRepository.updateUserStatus(ws.user.id, false);
      notifyUserDisconnection(ws.user.id);
      broadcastOnlineUsers();
    });
  });

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
      data.message
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


const broadcastMessage = async (chat_id, message) => {
  const chatParticipants = await chatService.fetchChatParticipants(chat_id);
  chatParticipants.forEach((user_id) => {
    const client = clients.get(user_id);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ chat_id, message }));
    }
  });
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

module.exports = { initializeWebSocket };
