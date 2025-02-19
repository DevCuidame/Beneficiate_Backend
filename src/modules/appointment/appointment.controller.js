const appointmentService = require('./appointment.service');
const { successResponse, errorResponse } = require('../../core/responses');

const createAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    successResponse(res, appointment, 'Cita creada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.getAppointmentById(id);
    successResponse(res, appointment, 'Cita recuperada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAppointment = await appointmentService.updateAppointment(
      id,
      req.body
    );
    successResponse(res, updatedAppointment, 'Cita actualizada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.cancelAppointment(id);
    successResponse(res, appointment, 'Cita cancelada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date } = req.body;
    const rescheduledAppointment =
      await appointmentService.rescheduleAppointment(id, appointment_date);
    successResponse(
      res,
      rescheduledAppointment,
      'Cita reprogramada exitosamente'
    );
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    successResponse(res, appointments, 'Citas recuperadas exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAppointmentsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const appointments = await appointmentService.getAppointmentsByUser(
      user_id
    );
    successResponse(
      res,
      appointments,
      'Citas del usuario recuperadas exitosamente'
    );
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAppointmentsByBeneficiary = async (req, res) => {
  try {
    const { beneficiary_id } = req.params;
    const appointments = await appointmentService.getAppointmentsByBeneficiary(
      beneficiary_id
    );
    successResponse(
      res,
      appointments,
      'Citas del beneficiario recuperadas exitosamente'
    );
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAppointmentsForCallCenter = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      beneficiaryId:
        req.query.beneficiaryId &&
        req.query.beneficiaryId !== 'null' &&
        !isNaN(req.query.beneficiaryId)
          ? parseInt(req.query.beneficiaryId)
          : null,
      isForBeneficiary: req.query.isForBeneficiary,

      page,
      limit,
    };


    const appointments = await appointmentService.getAppointmentsForCallCenter(
      filters
    );

    res.status(200).json({
      message: 'Citas para el call center recuperadas exitosamente',
      ...appointments,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      statusCode: 500,
    });
  }
};

module.exports = {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments,
  getAppointmentsByUser,
  getAppointmentsByBeneficiary,
  getAppointmentsForCallCenter,
};
