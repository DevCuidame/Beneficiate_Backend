const generateConfirmationMessage = (doctorName, date, time, recipientName) =>
  `📅 Estimado ${recipientName}, su cita con el Dr. ${doctorName} ha sido confirmada para el ${date} a las ${time}. ¡Gracias por confiar en nosotros!`;

const generateCancellationMessage = (doctorName, date, recipientName) =>
  `❌ Estimado ${recipientName}, lamentamos informarle que su cita con el Dr. ${doctorName} el ${date} ha sido cancelada.`;

const generateRescheduleMessage = (
  doctorName,
  oldDate,
  newDate,
  time,
  recipientName
) =>
  `🔄 Estimado ${recipientName}, su cita con el Dr. ${doctorName} ha sido reprogramada. Nueva fecha: ${newDate} a las ${time} (antes: ${oldDate}).`;

const generateReminderMessage = (doctorName, date, time, recipientName) =>
  `⏳ Recordatorio: Estimado ${recipientName}, tiene una cita con el Dr. ${doctorName} el ${date} a las ${time}. No olvide asistir.`;

module.exports = {
  generateConfirmationMessage,
  generateCancellationMessage,
  generateRescheduleMessage,
  generateReminderMessage,
};
