const pool = require('../../../config/connection');

/**
 * Obtiene los horarios de disponibilidad de un profesional.
 * @param {number} professionalId - ID del profesional.
 * @returns {Promise<Array>} - Lista de horarios de disponibilidad.
 */
const getAvailabilityByProfessionalId = async (professionalId) => {
  const query = `
    SELECT day_of_week, start_time, end_time 
    FROM medical_professional_availability 
    WHERE professional_id = $1
  `;
  const result = await pool.query(query, [professionalId]);
  return result.rows;
};

/**
 * Obtiene las citas confirmadas de un profesional en una fecha específica.
 * @param {number} professionalId - ID del profesional.
 * @param {string} date - Fecha en formato YYYY-MM-DD.
 * @returns {Promise<Array>} - Lista de citas agendadas.
 */
const getConfirmedAppointmentsByDate = async (professionalId, date) => {
  const query = `
    SELECT appointment_time, duration_minutes 
    FROM appointments 
    WHERE professional_id = $1 AND appointment_date = $2 AND status = 'CONFIRMED'
  `;
  const result = await pool.query(query, [professionalId, date]);
  return result.rows;
};

/**
 * Crea un nuevo horario de disponibilidad para un profesional.
 * @param {object} availabilityData - Datos del horario.
 * @returns {Promise<object>} - Horario creado.
 */
const createAvailability = async (availabilityData) => {
  const { professional_id, day_of_week, start_time, end_time } = availabilityData;

  const query = `
    INSERT INTO medical_professional_availability (professional_id, day_of_week, start_time, end_time)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [professional_id, day_of_week, start_time, end_time];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Actualiza un horario de disponibilidad de un profesional.
 * @param {number} id - ID del horario de disponibilidad.
 * @param {object} availabilityData - Datos a actualizar.
 * @returns {Promise<object>} - Horario actualizado.
 */
const updateAvailability = async (id, availabilityData) => {
  const { day_of_week, start_time, end_time } = availabilityData;

  const query = `
    UPDATE medical_professional_availability 
    SET day_of_week = $1, start_time = $2, end_time = $3
    WHERE id = $4
    RETURNING *;
  `;

  const values = [day_of_week, start_time, end_time, id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Elimina un horario de disponibilidad de un profesional.
 * @param {number} id - ID del horario de disponibilidad.
 * @returns {Promise<object>} - Mensaje de confirmación.
 */
const deleteAvailability = async (id) => {
  const query = `DELETE FROM medical_professional_availability WHERE id = $1`;
  await pool.query(query, [id]);
  return { message: 'Horario de disponibilidad eliminado correctamente' };
};

module.exports = {
  getAvailabilityByProfessionalId,
  getConfirmedAppointmentsByDate,
  createAvailability,
  updateAvailability,
  deleteAvailability
};
