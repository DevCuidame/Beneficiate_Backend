const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const routes = require('./src/routes');
const { handleErrors } = require('./src/core/errors');
const path = require('path');
require('./src/modules/appointment/expireAppointments.job');
const testWhatsApp = require('./src/modules/twilio/test-whatsapp');

const http = require('http');
const {
  initializeWebSocket,
} = require('./src/modules/websocket/websocket');

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

const server = http.createServer(app);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, wompi-signature');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Inicializar WebSocket con el servidor HTTP
initializeWebSocket(server);

app.use('/uploads', express.static('/home/beneficiate/uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Routes
app.use('/api/v1', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error Handling Middleware
app.use(handleErrors);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
// testWhatsApp();
});
