// src/utils/ticket.util.js
const crypto = require('crypto');

/**
 * Genera un número de ticket único para citas médicas
 * Formato: APT-XXXXX-YYYY donde X son caracteres alfanuméricos e Y es un timestamp
 * 
 * @param {Object} options - Opciones de configuración
 * @param {string} options.prefix - Prefijo para el ticket (por defecto: 'APT')
 * @param {number} options.randomLength - Longitud de la parte aleatoria (por defecto: 5)
 * @param {boolean} options.includeTimestamp - Si incluir timestamp (por defecto: true)
 * @returns {string} - Número de ticket único
 */
const generateTicketNumber = (options = {}) => {
  const {
    prefix = 'APT',
    randomLength = 5,
    includeTimestamp = true
  } = options;

  // Generar parte aleatoria
  const randomPart = crypto.randomBytes(randomLength)
    .toString('hex')
    .toUpperCase()
    .substring(0, randomLength);
  
  // Generar timestamp
  const timestamp = includeTimestamp 
    ? Date.now().toString().substring(7) // Últimos 6 dígitos del timestamp
    : '';
  
  // Formar el ticket
  return `${prefix}-${randomPart}-${timestamp}`;
};

/**
 * Verifica si un número de ticket ya existe en la base de datos
 * 
 * @param {string} ticketNumber - Número de ticket a verificar
 * @param {Object} pool - Conexión a la base de datos
 * @returns {Promise<boolean>} - true si existe, false si no
 */
const ticketExists = async (ticketNumber, pool) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM medical_appointments WHERE ticket_number = $1',
      [ticketNumber]
    );
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error al verificar número de ticket:', error);
    return false;
  }
};

/**
 * Genera un número de ticket único asegurándose que no existe en la BD
 * 
 * @param {Object} pool - Conexión a la base de datos
 * @param {Object} options - Opciones de configuración
 * @returns {Promise<string>} - Número de ticket único
 */
const generateUniqueTicketNumber = async (pool, options = {}) => {
  let ticketNumber;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (exists && attempts < maxAttempts) {
    ticketNumber = generateTicketNumber(options);
    exists = await ticketExists(ticketNumber, pool);
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('No se pudo generar un número de ticket único después de varios intentos');
  }
  
  return ticketNumber;
};

module.exports = {
  generateTicketNumber,
  generateUniqueTicketNumber,
  ticketExists
};