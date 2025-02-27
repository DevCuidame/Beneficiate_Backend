const medicalSpecialtiesRepository = require('./medical_specialties.repository');
const { ValidationError, NotFoundError } = require('../../core/errors');

const getMedicalSpecialtyById = async (id) => {
  const specialty = await medicalSpecialtiesRepository.findMedicalSpecialtyById(
    id
  );
  if (!specialty) {
    throw new NotFoundError('Especialidad médica no encontrada');
  }
  return specialty;
};

const getAll = async () => {
  const specialties = await medicalSpecialtiesRepository.getAll();
  if (!specialties || !specialties.length) {
    return [];
  }
  return specialties;
};

const createMedicalSpecialty = async (specialtyData) => {
  const existing = await medicalSpecialtiesRepository.findByName(
    specialtyData.name
  );
  if (existing) {
    throw new ValidationError('La especialidad ya existe');
  }

  const newSpecialty =
    await medicalSpecialtiesRepository.createMedicalSpecialty(specialtyData);
  return { ...newSpecialty };
};

const updateMedicalSpecialty = async (id, specialtyData) => {
  const specialty = await medicalSpecialtiesRepository.findMedicalSpecialtyById(
    id
  );
  if (!specialty) {
    throw new NotFoundError('Especialidad médica no encontrada');
  }
  const updatedSpecialty =
    await medicalSpecialtiesRepository.updateMedicalSpecialty(
      id,
      specialtyData
    );
  return { ...updatedSpecialty };
};

const deleteMedicalSpecialty = async (id) => {
  const specialty = await medicalSpecialtiesRepository.findMedicalSpecialtyById(
    id
  );
  if (!specialty) {
    throw new NotFoundError('Especialidad médica no encontrada');
  }
  await medicalSpecialtiesRepository.deleteMedicalSpecialty(id);
  return { message: 'Especialidad médica eliminada correctamente' };
};

module.exports = {
  getMedicalSpecialtyById,
  getAll,
  createMedicalSpecialty,
  updateMedicalSpecialty,
  deleteMedicalSpecialty,
};
