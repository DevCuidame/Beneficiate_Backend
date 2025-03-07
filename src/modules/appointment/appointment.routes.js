const express = require('express');
const appointmentService = require('./appointment.service');
const router = express.Router();
const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments,
  getAppointmentsByUser,
  getAppointmentsByBeneficiary,
  getAppointmentsForCallCenter,
  createNewAppointment
} = require('./appointment.controller');
const validate = require('../../middlewares/validate.middleware');
const { appointmentSchema } = require('./appointment.validation');

// Specific routes should come before parameter routes
router.get('/call-center', getAppointmentsForCallCenter);

// Other specific routes
router.post('/create', validate(appointmentSchema), createAppointment);
router.post('/create-new', validate(appointmentSchema), createNewAppointment);
router.get('/user/:user_id', getAppointmentsByUser);
router.get('/beneficiary/:beneficiary_id', getAppointmentsByBeneficiary);
router.put('/update/:id', validate(appointmentSchema), updateAppointment);
router.put('/reschedule/:id', validate(appointmentSchema), rescheduleAppointment);
router.delete('/cancel/:id', cancelAppointment);

// Generic parameter route should come last
router.get('/:id', getAppointmentById);

// Root route
router.get('/', getAllAppointments);

module.exports = router;