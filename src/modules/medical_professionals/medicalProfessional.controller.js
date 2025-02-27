const medicalProfessionalService = require('./medicalprofessional.service');
const { successResponse, errorResponse } = require('../../core/responses');

const getMedicalProfessionalById = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await medicalProfessionalService.getMedicalProfessionalById(id);
    successResponse(res, professional, 'Profesional médico recuperado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getMedicalProfessionalByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const professional = await medicalProfessionalService.getMedicalProfessionalByUserId(user_id);
    successResponse(res, professional, 'Profesional médico recuperado exitosamente para el usuario');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getAll = async (req, res) => {
  try {
    const professionals = await medicalProfessionalService.getAll();
    successResponse(res, professionals, 'Profesionales recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};


const createMedicalProfessional = async (req, res) => {
  try {
    const professional = await medicalProfessionalService.createMedicalProfessional(req.body);
    successResponse(res, professional, 'Profesional médico creado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const updateMedicalProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProfessional = await medicalProfessionalService.updateMedicalProfessional(id, req.body);
    successResponse(res, updatedProfessional, 'Profesional médico actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const deleteMedicalProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    await medicalProfessionalService.deleteMedicalProfessional(id);
    successResponse(res, null, 'Profesional médico eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const getMedicalProfessionalsBySpecialtyId = async (req, res) => {
  try {
    const { specialty_id } = req.params;
    const professionals = await medicalProfessionalService.getMedicalProfessionalsBySpecialtyId(specialty_id);
    successResponse(res, professionals, 'Profesionales recuperados exitosamente para la especialidad indicada');
  } catch (error) {
    errorResponse(res, error);
  }
};


module.exports = {
  getMedicalProfessionalById,
  getMedicalProfessionalByUserId,
  createMedicalProfessional,
  updateMedicalProfessional,
  deleteMedicalProfessional,
  getAll,
  getMedicalProfessionalsBySpecialtyId
};
