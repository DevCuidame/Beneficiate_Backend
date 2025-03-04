const appointmentRepository = require('./appointment.repository');
const { NotFoundError, ValidationError } = require('../../core/errors');
const { formatDatesInData } = require('../../utils/date.util');
const userService = require('../users/user.service');
const planService = require('../plans/plan.service');
const beneficiaryService = require('../beneficiaries/beneficiary.service');
const beneficiaryImage = require('../images/beneficiary/beneficiary.images.service');
const userImage = require('../images/user/user.images.service');

const createAppointment = async (appointmentData) => {
  let { user_id, beneficiary_id, appointment_date, status, notes, is_for_beneficiary } =
    appointmentData;

  if (typeof is_for_beneficiary !== 'boolean') {
    throw new ValidationError(
      'El campo "is_for_beneficiary" debe ser un valor booleano (true o false).'
    );
  }

  const user = await userService.getUserById(user_id);
  if (!user || !user.plan_id) {
    throw new ValidationError('El usuario no tiene un plan activo y no puede agendar citas.');
  }

  const plan = await planService.getPlanById(user.plan_id);
  if (!plan) {
    throw new NotFoundError('No se encontró un plan asociado al usuario.');
  }

  const isIndividualPlan = plan.code === 'INDIVIDUAL-UNIQUE-X9Y7Z';
  const isFamilyPlan = plan.code === 'FAMILY-UNIQUE-A1B2C3';
  
  if (is_for_beneficiary) {
    if (!beneficiary_id) {
      throw new ValidationError('Debe proporcionar un beneficiario si "is_for_beneficiary" es true.');
    }

    if (isIndividualPlan) {
      throw new ValidationError('El plan INDIVIDUAL solo permite agendar citas para el usuario.');
    }

    const beneficiary = await beneficiaryService.getBeneficiaryById(beneficiary_id);
    if (!beneficiary) {
      throw new NotFoundError('El beneficiario no existe.');
    }

    if (Number(beneficiary.user_id) !== user_id) {
      throw new ValidationError('El beneficiario no pertenece al usuario.');
    }

  } else {
    beneficiary_id = null;

    if (!user_id) {
      throw new ValidationError('Debe proporcionar un usuario si "is_for_beneficiary" es false.');
    }
  }

  if (is_for_beneficiary && (isFamilyPlan || !isIndividualPlan)) {
    const beneficiaryCount = await beneficiaryService.countUserBeneficiaries(user_id);
    if (beneficiaryCount >= plan.max_beneficiaries) {
      throw new ValidationError('Se ha alcanzado el número máximo de beneficiarios permitidos por el plan.');
    }
  }

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
  
  const formattedAppointment = formatDatesInData(appointment, ['appointment_date']);
  
  if (formattedAppointment.is_for_beneficiary) {
    let beneficiary = await beneficiaryService.getBeneficiaryById(formattedAppointment.beneficiary_id);
    const images = await beneficiaryImage.getBeneficiaryImages(beneficiary.id);
    beneficiary = { ...beneficiary, image: images.length > 0 ? images[0] : null };
    formattedAppointment.userData = beneficiary;
  } else {
    let user = await userService.getUserById(formattedAppointment.user_id);
    const images = await userImage.getUserImages(user.id);
    user = { ...user, image: images.length > 0 ? images[0] : null };
    formattedAppointment.userData = user;
  }
  
  return formattedAppointment;
};


const updateAppointment = async (id, data) => {
  const existingAppointment = await appointmentRepository.getAppointment(id);
  if (!existingAppointment) {
    throw new NotFoundError('Cita no encontrada.');
  }

  const updatedAppointment = await appointmentRepository.updateAppointment(
    id,
    data
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
  const enrichedAppointments = await Promise.all(
    appointments.map(async (appointment) => {
      const formattedAppointment = formatDatesInData(appointment, ['appointment_date']);
      formattedAppointment.created_at_formatted = formatDateTime(formattedAppointment.created_at);

      
      if (formattedAppointment.is_for_beneficiary) {
        let beneficiary = await beneficiaryService.getBeneficiaryById(formattedAppointment.beneficiary_id);
        const images = await beneficiaryImage.getBeneficiaryImages(beneficiary.id);
        beneficiary = { ...beneficiary, image: images.length > 0 ? images[0] : null };
        formattedAppointment.userData = beneficiary;
      } else {
        let user = await userService.getUserById(formattedAppointment.user_id);
        const images = await userImage.getUserImages(user.id);
        user = { ...user, image: images.length > 0 ? images[0] : null };
        formattedAppointment.userData = user;
      }
      
      return formattedAppointment;
    })
  );
  
  // Calcular el contador de estados
  const statusCounts = enrichedAppointments.reduce((acc, appointment) => {
    const status = appointment.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  return {
    data: enrichedAppointments,
    counts: statusCounts
  };
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  
  // Formateo de la fecha (Ej: "31 de agosto")
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  // Formateo de la hora en 12 horas con AM/PM (Ej: "11:00 am")
  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // Para usar AM/PM
  });

  return `${formattedDate}, ${formattedTime}`;
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
