const professionalAvailabilityRepository = require('./professionalAvailability.repository');
const { NotFoundError } = require('../../../core/errors');
const moment = require('moment');
/**
 * Obtiene los horarios disponibles de un profesional en una fecha específica.
 * @param {number} professionalId - ID del profesional.
 * @param {string} date - Fecha en formato YYYY-MM-DD.
 * @returns {Promise<Array<string>>} - Lista de horarios disponibles.
 */
const getProfessionalAvailability = async (professionalId, date) => {
    // 1️⃣ Obtener la disponibilidad del profesional
    const availability = await professionalAvailabilityRepository.getAvailabilityByProfessionalId(professionalId);
    if (!availability.length) {
        throw new NotFoundError('No hay disponibilidad registrada para este profesional.');
    }

    // 2️⃣ Obtener citas ya ocupadas para ese día
    const appointments = await professionalAvailabilityRepository.getConfirmedAppointmentsByDate(professionalId, date);
    const bookedTimes = appointments.map(appt => ({
        time: appt.appointment_time,
        duration: appt.duration_minutes
    }));

    // 3️⃣ Generar bloques de tiempo disponibles
    const availableSlots = [];
    for (const slot of availability) {
        let currentTime = new Date(`${date}T${slot.start_time}`);
        const endTime = new Date(`${date}T${slot.end_time}`);

        while (currentTime < endTime) {
            const timeStr = currentTime.toTimeString().split(' ')[0]; // Formato HH:mm:ss
            const isBooked = bookedTimes.some(booking => booking.time === timeStr);

            if (!isBooked) {
                availableSlots.push(timeStr);
            }

            currentTime.setMinutes(currentTime.getMinutes() + 30); // Intervalo de 30 min
        }
    }

    return availableSlots;
};

/**
 * Obtiene la disponibilidad semanal de un profesional.
 * @param {number} professionalId - ID del profesional.
 * @returns {Promise<Object>} - Disponibilidad estructurada por días de la semana.
 */
const getWeeklyAvailability = async (professionalId) => {
    const availability = await professionalAvailabilityRepository.getAvailabilityByProfessionalId(professionalId);

    if (!availability.length) {
        throw new NotFoundError('No hay disponibilidad registrada para este profesional.');
    }

    const today = moment(); // Día actual
    const daysOfWeek = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const structuredAvailability = {};
    availability.forEach(slot => {
        const dayIndex = daysOfWeek.indexOf(slot.day_of_week);
        if (dayIndex === -1) return;

        let nextAvailableDate = today.clone().isoWeekday(dayIndex);

        // Si el día ya pasó en la semana, moverlo a la siguiente semana
        if (nextAvailableDate.isBefore(today, 'day')) {
            nextAvailableDate.add(1, 'week');
        }

        const dayNumber = nextAvailableDate.date();
        const monthName = months[nextAvailableDate.month()];
        const currentMonth = today.month();
        const formattedDate = (nextAvailableDate.month() !== currentMonth)
            ? `${slot.day_of_week} ${dayNumber} de ${monthName}`
            : `${slot.day_of_week} ${dayNumber}`;

        structuredAvailability[slot.day_of_week] = {
            start: slot.start_time,
            end: slot.end_time,
            date: nextAvailableDate.format("YYYY-MM-DD"),
            formatted_date: formattedDate // ✅ Nuevo campo con formato adecuado
        };
    });

    return structuredAvailability;
};
/**
 * Crea un nuevo horario de disponibilidad para un profesional.
 * @param {object} availabilityData - Datos del horario.
 * @returns {Promise<object>} - Horario creado.
 */
const createProfessionalAvailability = async (availabilityData) => {
    return await professionalAvailabilityRepository.createAvailability(availabilityData);
};

/**
 * Actualiza un horario de disponibilidad de un profesional.
 * @param {number} id - ID del horario de disponibilidad.
 * @param {object} availabilityData - Datos a actualizar.
 * @returns {Promise<object>} - Horario actualizado.
 */
const updateProfessionalAvailability = async (id, availabilityData) => {
    return await professionalAvailabilityRepository.updateAvailability(id, availabilityData);
};

/**
 * Elimina un horario de disponibilidad de un profesional.
 * @param {number} id - ID del horario de disponibilidad.
 * @returns {Promise<object>} - Mensaje de confirmación.
 */
const deleteProfessionalAvailability = async (id) => {
    return await professionalAvailabilityRepository.deleteAvailability(id);
};

module.exports = {
    getProfessionalAvailability,
    createProfessionalAvailability,
    updateProfessionalAvailability,
    deleteProfessionalAvailability,
    getWeeklyAvailability
};
