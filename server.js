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
app.use(cors({
  origin: ['https://beneficiate.co', 'http://localhost:4200'], // List all allowed origins instead of '*' for better security
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'wompi-signature']
}));

// body parser with increased limits for various content types
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

const server = http.createServer(app);

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
