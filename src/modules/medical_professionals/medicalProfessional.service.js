const medicalProfessionalRepository = require('./medicalProfessional.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');

const getMedicalProfessionalById = async (id) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalById(id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado');
  }
  return professional;
};

const getMedicalProfessionalByUserId = async (user_id) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalByUserId(user_id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado para el usuario');
  }
  return professional;
};

const getAll = async () => {
  const professionals = await medicalProfessionalRepository.getAll();
  if (!professionals || !professionals.length) {
    return [];
  }
  return professionals;
};


const createMedicalProfessional = async (professionalData) => {
  // Validar que el usuario no tenga ya registrado un profesional
  const existingProfessional = await medicalProfessionalRepository.findMedicalProfessionalByUserId(professionalData.user_id);
  if (existingProfessional) {
    throw new ValidationError('El usuario ya tiene un profesional médico registrado.');
  }

  professionalData.created_at = new Date();

  const newProfessional = await medicalProfessionalRepository.createMedicalProfessional(professionalData);
 
  return { ...newProfessional };
};

const updateMedicalProfessional = async (id, professionalData) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalById(id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado');
  }

  const updatedProfessional = await medicalProfessionalRepository.updateMedicalProfessional(id, professionalData);

  return { ...updatedProfessional };
};

const deleteMedicalProfessional = async (id) => {
  const professional = await medicalProfessionalRepository.findMedicalProfessionalById(id);
  if (!professional) {
    throw new NotFoundError('Profesional médico no encontrado');
  }
  await medicalProfessionalRepository.deleteMedicalProfessional(id);
  return { message: 'Profesional médico eliminado correctamente' };
};

module.exports = {
  getMedicalProfessionalById,
  getMedicalProfessionalByUserId,
  createMedicalProfessional,
  updateMedicalProfessional,
  deleteMedicalProfessional,
  getAll
};
