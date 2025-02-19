const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const routes = require('./src/routes');
const { handleErrors } = require('./src/core/errors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({origin: '*'}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/uploads', express.static('/home/beneficiate/uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Routes
console.log("✅ Registrando rutas desde 'routes'...");
app.use('/api/v1', routes);



app.get('/', (req, res) => {
  console.log("✅ La API está funcionando correctamente");
  res.json({ message: 'Server is running' });
});


// Error Handling Middleware
app.use(handleErrors);

// app.use((err, req, res, next) => {
//   console.error("❌ Error capturado en middleware global:", err.stack);
//   res.status(500).json({ error: err.message });
// });


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

});
