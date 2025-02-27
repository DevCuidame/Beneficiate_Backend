const cron = require('node-cron');
const appointmentRepository = require('./appointment.repository');

const expireOldAppointments = async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const result = await appointmentRepository.expireOldAppointments(twoHoursAgo);
    if (result.rowCount > 0) {
      console.log(`Expiradas ${result.rowCount} citas pendientes.`);
    }
  } catch (error) {
    console.error('Error al expirar citas antiguas:', error);
  }
};

cron.schedule('*/5 * * * *', expireOldAppointments);

module.exports = {
  expireOldAppointments,
};
