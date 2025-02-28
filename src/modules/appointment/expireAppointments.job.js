const cron = require('node-cron');
const appointmentRepository = require('./appointment.repository');

const expireOldAppointments = async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await appointmentRepository.expireOldAppointments(twoHoursAgo);
  } catch (error) {
    console.error('Error al expirar citas antiguas:', error);
  }
};

cron.schedule('*/5 * * * *', expireOldAppointments);

module.exports = {
  expireOldAppointments,
};
