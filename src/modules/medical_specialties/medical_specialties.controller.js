const medicalSpecialtiesService = require('./medical_specialties.service');
const { successResponse, errorResponse } = require('../../core/responses');

const getMedicalSpecialtyById = async (req, res) => {
  try {
    const { id } = req.params;
    const specialty = await medicalSpecialtiesService.getMedicalSpecialtyById(id);
    successResponse(res, specialty, 'Especialidad médica recuperada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAll = async (req, res) => {
  try {
    const specialties = await medicalSpecialtiesService.getAll();
    successResponse(res, specialties, 'Especialidades recuperadas exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const createMedicalSpecialty = async (req, res) => {
  try {
    const specialty = await medicalSpecialtiesService.createMedicalSpecialty(req.body);
    successResponse(res, specialty, 'Especialidad médica creada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const updateMedicalSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSpecialty = await medicalSpecialtiesService.updateMedicalSpecialty(id, req.body);
    successResponse(res, updatedSpecialty, 'Especialidad médica actualizada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const deleteMedicalSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    await medicalSpecialtiesService.deleteMedicalSpecialty(id);
    successResponse(res, null, 'Especialidad médica eliminada exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  getMedicalSpecialtyById,
  getAll,
  createMedicalSpecialty,
  updateMedicalSpecialty,
  deleteMedicalSpecialty,
};
