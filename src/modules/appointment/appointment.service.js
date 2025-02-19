const appointmentRepository = require('./appointment.repository');
const { NotFoundError, ValidationError } = require('../../core/errors');
const { formatDatesInData } = require('../../utils/date.util');
const userService = require('../users/user.service');
const planService = require('../plans/plan.service');
const beneficiaryService = require('../beneficiaries/beneficiary.service');


const createAppointment = async (appointmentData) => {
  let { user_id, beneficiary_id, appointment_date, status, notes, is_for_beneficiary } =
    appointmentData;

  // ✅ Validar que `is_for_beneficiary` sea booleano
  if (typeof is_for_beneficiary !== 'boolean') {
    throw new ValidationError(
      'El campo "is_for_beneficiary" debe ser un valor booleano (true o false).'
    );
  }

  // ✅ Verificar si el usuario tiene un plan activo
  const user = await userService.getUserById(user_id);
  if (!user || !user.plan_id) {
    throw new ValidationError('El usuario no tiene un plan activo y no puede agendar citas.');
  }

  // ✅ Obtener información del plan
  const plan = await planService.getPlanById(user.plan_id);
  if (!plan) {
    throw new NotFoundError('No se encontró un plan asociado al usuario.');
  }

  // ✅ Determinar el tipo de plan (INDIVIDUAL, FAMILIAR u OTRO)
  const isIndividualPlan = plan.code === 'INDIVIDUAL-UNIQUE-X9Y7Z';
  const isFamilyPlan = plan.code === 'FAMILY-UNIQUE-A1B2C3';
  
  // 🚀 **Validar la lógica según el tipo de plan**
  if (is_for_beneficiary) {
    // 📌 **Si la cita es para un beneficiario**
    if (!beneficiary_id) {
      throw new ValidationError('Debe proporcionar un beneficiario si "is_for_beneficiary" es true.');
    }

    // ❌ Plan Individual NO permite citas para beneficiarios
    if (isIndividualPlan) {
      throw new ValidationError('El plan INDIVIDUAL solo permite agendar citas para el usuario.');
    }

    // ✅ Obtener al beneficiario y validar que pertenezca al usuario
    const beneficiary = await beneficiaryService.getBeneficiaryById(beneficiary_id);
    if (!beneficiary) {
      throw new NotFoundError('El beneficiario no existe.');
    }

    if (Number(beneficiary.user_id) !== user_id) {
      throw new ValidationError('El beneficiario no pertenece al usuario.');
    }

  } else {
    // 📌 **Si la cita es para el usuario**
    beneficiary_id = null;

    if (!user_id) {
      throw new ValidationError('Debe proporcionar un usuario si "is_for_beneficiary" es false.');
    }
  }

  // ✅ Solo verificar el límite de beneficiarios si la cita es para un beneficiario
  if (is_for_beneficiary && (isFamilyPlan || !isIndividualPlan)) {
    const beneficiaryCount = await beneficiaryService.countUserBeneficiaries(user_id);
    if (beneficiaryCount >= plan.max_beneficiaries) {
      throw new ValidationError('Se ha alcanzado el número máximo de beneficiarios permitidos por el plan.');
    }
  }

  // ✅ Llamar al repositorio para crear la cita
  const appointment = await appointmentRepository.createAppointment({
    user_id,
    beneficiary_id,
    appointment_date,
    status: status || 'PENDING',
    notes,
    is_for_beneficiary
  });

  return formatDatesInData(appointment, ['appointment_date']);
};


const getAppointmentById = async (id) => {
  const appointment = await appointmentRepository.getAppointment(id);
  if (!appointment) {
    throw new NotFoundError('Cita no encontrada.');
  }
  return formatDatesInData(appointment, ['appointment_date']);
};

const updateAppointment = async (id, appointmentData) => {
  const existingAppointment = await appointmentRepository.getAppointment(id);
  if (!existingAppointment) {
    throw new NotFoundError('Cita no encontrada.');
  }

  const updatedAppointment = await appointmentRepository.updateAppointment(
    id,
    appointmentData
  );
  return formatDatesInData(updatedAppointment, ['appointment_date']);
};

const cancelAppointment = async (id) => {
  const appointment = await appointmentRepository.cancelAppointment(id);
  if (!appointment) {
    throw new NotFoundError('Cita no encontrada.');
  }
  return formatDatesInData(appointment, ['appointment_date']);;
};

const rescheduleAppointment = async (id, newDate) => {
  const appointment = await appointmentRepository.rescheduleAppointment(
    id,
    newDate
  );
  if (!appointment) {
    throw new NotFoundError('Cita no encontrada.');
  }
  return formatDatesInData(appointment, ['appointment_date']);
};

const getAllAppointments = async () => {
  const appointments = await appointmentRepository.getAllAppointments();
  return appointments.map((appointment) =>
    formatDatesInData(appointment, ['appointment_date'])
  );
};

const getAppointmentsByUser = async (user_id) => {
  const appointments = await appointmentRepository.getAppointmentsByUser(
    user_id
  );
  return appointments.map((appointment) =>
    formatDatesInData(appointment, ['appointment_date'])
  );
};

const getAppointmentsByBeneficiary = async (beneficiary_id) => {
  const appointments = await appointmentRepository.getAppointmentsByBeneficiary(
    beneficiary_id
  );
  return appointments.map((appointment) =>
    formatDatesInData(appointment, ['appointment_date'])
  );
};


const getAppointmentsForCallCenter = async (filter) => {
  const { data, total, totalPages, currentPage } = await appointmentRepository.getAppointmentsForCallCenter(
    filter
  );
  
  const formattedAppointments = data.map((appointment) =>
    formatDatesInData(appointment, ['appointment_date'])
  );
  
  return {
    data: formattedAppointments,
    total,
    totalPages,
    currentPage
  };
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
