# 📡 WebSockets

Este documento describe la implementación de WebSockets en Beneficiate para comunicación en tiempo real, incluyendo chat en vivo, notificaciones de citas y actualizaciones de estado.

## Introducción

Beneficiate implementa WebSockets para proporcionar una experiencia en tiempo real a los usuarios. Esta tecnología permite:

- Chat entre usuarios y agentes de atención al cliente
- Notificaciones instantáneas de cambios en citas médicas
- Sistema de chatbot para programación de citas
- Actualizaciones de estado en línea/fuera de línea
- Transmisión de eventos en todo el sistema

## Arquitectura WebSocket

### 2.1 Inicialización y Configuración

```javascript
// src/modules/websocket/websocket.js
const initializeWebSocket = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    // Autenticación mediante token en sec-websocket-protocol
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

      // Obtener datos del usuario
      const userData = await userRepository.getUserById(decodedToken.id);
      if (!userData) {
        socket.destroy();
        return;
      }

      // Verificar si es un agente de call center
      let isAgent = false;
      let agentData = null;
      let agentActive = false;
      
      try {
        agentData = await callCenterAgentService.getCallCenterAgentByUserId(userData.id);
        if (agentData) {
          isAgent = true;
          agentActive = agentData.status === 'ACTIVE';
        }
      } catch (agentError) {
        console.log(`Usuario ${userData.id} no es un agente o hubo un error al verificar`);
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
  
  // Manejo de conexiones, eventos y cierre
  // ...
  
  return wss;
};
```

### 2.2 Gestión de Conexiones

El sistema mantiene un registro de los clientes conectados a través de mapas:

```javascript
const clients = new Map();           // Usuarios regulares
const onlineUsers = new Set();       // Usuarios en línea (IDs)
const agentClients = new Map();      // Agentes de atención
```

Cuando un usuario se conecta:

```javascript
wss.on('connection', async (ws, req) => {
  const user = req.user;
  
  ws.user = user;
  
  if (user.isAgent && user.agentActive) {
    // Configurar conexión de agente
    agentClients.set(user.agentId, ws);
    
    // Notificar al agente de su estado
    ws.send(JSON.stringify({ event: 'agent_connected', agent: { /* datos */ } }));
    
    // Enviar datos iniciales (chats activos, usuarios en línea)
    // ...
  } else {
    // Configurar conexión de usuario regular
    clients.set(user.id, ws);
  }
  
  // Actualizar estado en línea
  onlineUsers.add(user.id);
  await userRepository.updateUserStatus(user.id, true);
  
  // Notificar a otros usuarios
  notifyUserConnection(user.id);
  broadcastOnlineUsers();
  
  // Enviar datos iniciales según tipo de usuario
  // ...
});
```

### 2.3 Comunicación en Tiempo Real

#### 2.3.1 Bus de Eventos

El sistema implementa un bus de eventos para manejar la comunicación entre módulos:

```javascript
// src/modules/websocket/websocket-events.js
const eventHandlers = new Map();

const on = (eventName, handler) => {
  if (!eventHandlers.has(eventName)) {
    eventHandlers.set(eventName, []);
  }
  eventHandlers.get(eventName).push(handler);
};

const emit = (eventName, data) => {
  const handlers = eventHandlers.get(eventName);
  if (handlers && handlers.length > 0) {
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in handler for event '${eventName}':`, error);
      }
    });
  }
};
```

#### 2.3.2 Manejadores de Mensajes

```javascript
ws.on('message', async (message) => {
  try {
    const data = JSON.parse(message);
    
    // Manejar mensajes del chatbot
    if (data.source === 'chatbot') {
      await chatbotFlow.handleChatbotFlow(ws, data);
      return;
    }
    
    // Manejar diferentes tipos de eventos
    switch (data.event) {
      case 'chatbot_init':
        // Inicializar flujo de chatbot
        break;
      case 'chat_message':
        // Procesar mensaje de chat regular
        await handleMessage(ws, data);
        break;
      case 'agent_chat_message':
        // Procesar mensaje de chat con agente
        await handleAgentChatMessage(ws, data);
        break;
      case 'message_read':
        // Marcar mensaje como leído
        await handleMessageRead(data.chat_id, ws.user.id, data.message_id);
        break;
      case 'typing':
        // Notificar "está escribiendo"
        notifyTyping(data.chat_id, ws.user.id);
        break;
      case 'stop_typing':
        // Notificar "dejó de escribir"
        notifyStopTyping(data.chat_id, ws.user.id);
        break;
      case 'close_chat':
        // Cerrar una conversación
        await handleCloseChat(ws, data);
        break;
    }
  } catch (error) {
    console.error('Error processing message:', error);
    ws.send(JSON.stringify({ error: 'Error al procesar el mensaje' }));
  }
});
```

### 2.4 Funcionalidades de Chat

#### 2.4.1 Mensajería Regular

```javascript
const handleMessage = async (ws, data) => {
  try {
    if (!data.chat_id || !data.sender_id || !data.message) {
      ws.send(JSON.stringify({ error: 'Datos incompletos para enviar el mensaje' }));
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
```

#### 2.4.2 Chat con Agentes

```javascript
const handleAgentChatMessage = async (ws, data) => {
  try {
    const { chat_id, message } = data;
    if (!chat_id || !message) {
      ws.send(JSON.stringify({ event: 'error', message: 'Se requieren chat_id y message' }));
      return;
    }

    const sender_id = ws.agent ? ws.agent.id : ws.user.id;
    const sender_type = ws.agent ? 'AGENT' : 'USER';

    // Enviar mensaje mediante el servicio
    const sentMessage = await agentChatService.sendMessage(chat_id, sender_id, sender_type, message);
    
    // Crear payload
    const messagePayload = { /* datos del mensaje */ };

    // Obtener el chat y notificar a ambos participantes
    const chat = await agentChatService.findChatById(chat_id);
    if (chat) {
      // Notificar al usuario
      const userClient = clients.get(chat.user_id);
      if (userClient && userClient.readyState === WebSocket.OPEN) {
        userClient.send(JSON.stringify(messagePayload));
      }

      // Notificar al agente
      const agentClient = agentClients.get(chat.agent_id);
      if (agentClient && agentClient.readyState === WebSocket.OPEN) {
        agentClient.send(JSON.stringify(messagePayload));
      }
    }
  } catch (error) {
    console.error('Error enviando mensaje de chat de agente:', error);
    ws.send(JSON.stringify({ event: 'error', message: 'Error al enviar el mensaje: ' + error.message }));
  }
};
```

### 2.5 Flujo de Chatbot

El sistema implementa un chatbot guiado para ayudar a los usuarios a agendar citas médicas:

```javascript
// src/modules/websocket/chatbotFlow.js
const STATES = {
  AWAITING_DOCUMENT: 'awaiting_document',
  AWAITING_CITY_SELECTION: 'awaiting_city_selection',
  AWAITING_SPECIALTY_SEARCH: 'awaiting_specialty_search',
  AWAITING_SPECIALTY_SELECTION: 'awaiting_specialty_selection',
  AWAITING_VISIT_TYPE: 'awaiting_visit_type',
  AWAITING_DESCRIPTION: 'awaiting_description',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed',
};

async function handleChatbotFlow(ws, data) {
  try {
    // Inicialización del chatbot
    if (data.event === 'init' || data.event === 'chatbot_init') {
      ws.botState = STATES.AWAITING_DOCUMENT;
      const welcomeMsg = {
        event: 'chatbot_message',
        message: 'Bienvenido al chat de citas. Para empezar, por favor ingresa el documento...',
        sender_type: 'BOT',
      };
      sendMessage(ws, welcomeMsg);
      return;
    }

    // Manejar estados del chatbot
    switch (ws.botState) {
      case STATES.AWAITING_DOCUMENT:
        // Validar documento y avanzar al siguiente estado
        break;
      case STATES.AWAITING_CITY_SELECTION:
        // Procesar selección de ciudad
        break;
      case STATES.AWAITING_SPECIALTY_SEARCH:
        // Buscar especialidades médicas
        break;
      case STATES.AWAITING_SPECIALTY_SELECTION:
        // Procesar selección de especialidad
        break;
      case STATES.AWAITING_VISIT_TYPE:
        // Procesar tipo de visita (primera vez o control)
        break;
      case STATES.AWAITING_DESCRIPTION:
        // Capturar descripción de la consulta
        break;
      case STATES.CONFIRMATION:
        // Confirmar agendamiento
        break;
      default:
        // Manejar estado desconocido
        break;
    }
  } catch (error) {
    console.error('Error en el flujo del chatbot:', error);
    sendMessage(ws, {
      event: 'chatbot_message',
      message: 'Error interno, por favor intente nuevamente más tarde.',
      sender_type: 'BOT',
    });
  }
}
```

### 2.6 Cierre de Conexiones

```javascript
ws.on('close', async () => {
  try {
    const userId = ws.user.id;

    // Eliminar de la lista correspondiente
    if (ws.agent) {
      agentClients.delete(ws.agent.id);
    } else {
      clients.delete(userId);
    }

    // Actualizar estado en línea si no hay otra conexión del mismo usuario
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
```

## 3. Integración con el Servidor Principal

### 3.1 Inicialización en el Servidor

```javascript
// src/server.js
const { initializeWebSocket } = require('./modules/websocket/websocket');

const app = express();
// Configuración de Express...

const server = http.createServer(app);
const wss = initializeWebSocket(server);

// Iniciar servidor HTTP
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3.2 Middleware de Autenticación

El sistema utiliza JWT para autenticar las conexiones WebSocket:

```javascript
// El token JWT se envía como protocolo WebSocket
// En el cliente:
const socket = new WebSocket(`${WS_URL}`, ['echo-protocol', token]);

// En el servidor se verifica durante la solicitud de upgrade
const decodedToken = jwt.verifyToken(token, process.env.JWT_SECRET);
```

## 4. Diagramas de Flujo

### 4.1 Flujo de Procesamiento de Pagos

```
Usuario   Sistema   Wompi
   |        |        |
   | -----> |        |  Selecciona plan
   |        | -----> |  Crea enlace de pago
   |        | <----- |  Devuelve URL de pago
   | <----- |        |  Redirige a URL de pago
   | -----------------> Realiza pago en Wompi
   |        | <----- |  Notifica cambio (webhook)
   |        |        |  
   |        | Verifica firma
   |        | Actualiza estado
   |        | Actualiza plan de usuario
   | <----- |        |  Notifica éxito
```

### 4.2 Flujo de Chat en Tiempo Real

```
Usuario A   Sistema    Usuario B
    |          |          |
    | -------> |          |  Envía mensaje
    |          | Guarda en BD
    |          | --------> |  Notifica mensaje nuevo
    |          | <-------- |  Marca como leído
    | <------- |          |  Notifica lectura
```

### 4.3 Flujo de Chatbot para Citas

```
Usuario    Sistema     BD
   |          |         |
   | -------> |         |  Inicia chatbot
   | <------- |         |  Solicita documento
   | -------> |         |  Envía documento
   |          | ------> |  Valida documento
   |          | <------ |  Confirma validez
   | <------- |         |  Solicita ciudad
   | -------> |         |  Selecciona ciudad
   | <------- |         |  Solicita especialidad
   | -------> |         |  Selecciona especialidad
   | <------- |         |  Solicita tipo visita
   | -------> |         |  Selecciona tipo
   | <------- |         |  Solicita descripción
   | -------> |         |  Envía descripción
   | <------- |         |  Muestra resumen y pide confirmación
   | -------> |         |  Confirma agendamiento
   |          | ------> |  Guarda cita pendiente
   | <------- |         |  Confirma éxito
```