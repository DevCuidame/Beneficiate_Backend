const { format } = require('date-fns');

/**
 * Formatea una fecha en un formato legible.
 * @param {string|Date|null} date - La fecha a formatear.
 * @param {string} formatStr - El formato deseado (por defecto: 'yyyy-MM-dd HH:mm:ss').
 * @returns {string|null} - La fecha formateada o null si es inválida.
 */
const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
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
const formatDatesInData = (data, fields = ['created_at', 'updated_at', 'vaccination_date', 'diagnosed_date' ,'history_date']) => {
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


// Función para formatear la fecha: "14 de Abril de 2025"
const formatAppointmentDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Función para formatear la hora: "08:00 a.m."
const formatAppointmentTime = (timeString) => {
  if (!timeString) return '';
  // Se asume que timeString viene en formato "HH:MM:SS"
  const [hours, minutes, seconds] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Función para obtener el día de la semana en español (ej.: "Viernes")
const getDayName = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  let dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
  // Capitaliza la primera letra
  return dayName.charAt(0).toUpperCase() + dayName.slice(1);
};


module.exports = { formatDate, formatDatesInData, formatAppointmentDate, formatAppointmentTime, getDayName };
