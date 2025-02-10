const { format } = require('date-fns');

/**
 * Formatea una fecha en un formato legible.
 * @param {string|Date|null} date - La fecha a formatear.
 * @param {string} formatStr - El formato deseado (por defecto: 'yyyy-MM-dd HH:mm:ss').
 * @returns {string|null} - La fecha formateada o null si es inválida.
 */
const formatDate = (date, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  if (!date) return null; // Si la fecha es null o undefined, devolver null

  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return null; // Si la fecha es inválida, devolver null

    return format(parsedDate, formatStr);
  } catch (error) {
    console.error('Error al formatear la fecha:', error);
    return null;
  }
};

/**
 * Aplica el formato de fecha a un conjunto de datos.
 * @param {Array|Object} data - El objeto o array de objetos a formatear.
 * @param {Array<string>} fields - Los campos que contienen fechas.
 * @returns {Array|Object} - El mismo objeto o array con las fechas formateadas.
 */
const formatDatesInData = (data, fields = ['created_at', 'updated_at']) => {
  if (Array.isArray(data)) {
    return data.map((item) => formatDatesInData(item, fields));
  } else if (typeof data === 'object' && data !== null) {
    const formattedData = { ...data };
    fields.forEach((field) => {
      if (formattedData[field]) {
        formattedData[field] = formatDate(formattedData[field]);
      }
    });
    return formattedData;
  }
  return data;
};

module.exports = { formatDate, formatDatesInData };
