const userHealthService = require('./user.health.service');
const { successResponse, errorResponse } = require('../../../core/responses');

/**
 * Controlador para obtener los datos de salud de un usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const getUserHealthData = async (req, res) => {
  try {
    const { user_id } = req.params;
    const healthData = await userHealthService.getUserHealthData(user_id);
    
    if (!healthData) {
      return successResponse(res, {}, 'No hay datos de salud para este usuario');
    }
    
    successResponse(res, healthData, 'Datos de salud recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para crear o actualizar historial médico y familiar de un usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const createMedicalFamilyHistory = async (req, res) => {
  try {
    const result = await userHealthService.createMedicalFamilyHistory(req.body);
    successResponse(res, result, 'Historial médico y familiar actualizado correctamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para crear o actualizar datos de salud de un usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const createHealthData = async (req, res) => {
  try {
    const result = await userHealthService.createHealthData(req.body);
    successResponse(res, result, 'Datos de salud actualizados correctamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para crear o actualizar alergias y medicamentos de un usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const createAllergiesAndMedications = async (req, res) => {
  try {
    const result = await userHealthService.createAllergiesAndMedications(req.body);
    successResponse(res, result, 'Alergias y medicamentos actualizados correctamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

/**
 * Controlador para crear o actualizar vacunas de un usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
const createVaccinations = async (req, res) => {
  try {
    const result = await userHealthService.createVaccinations(req.body);
    successResponse(res, result, 'Vacunas actualizadas correctamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

// Controladores para cada tipo de datos de salud específicos
const getByUserId = async (req, res, table) => {
  try {
    const { user_id } = req.params;
    const records = await userHealthService.getByUserId(table, user_id);
    successResponse(res, records, 'Registros recuperados exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

// Controlador para obtener alergias del usuario
const getAllergiesByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_allergies');
};

// Controlador para obtener discapacidades del usuario
const getDisabilitiesByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_disabilities');
};

// Controlador para obtener enfermedades del usuario
const getDiseasesByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_diseases');
};

// Controlador para obtener distintivos del usuario
const getDistinctivesByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_distinctives');
};

// Controlador para obtener historial familiar del usuario
const getFamilyHistoryByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_family_history');
};

// Controlador para obtener historial médico del usuario
const getMedicalHistoryByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_medical_history');
};

// Controlador para obtener medicamentos del usuario
const getMedicationsByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_medications');
};

// Controlador para obtener vacunas del usuario
const getVaccinationsByUserId = async (req, res) => {
  return getByUserId(req, res, 'user_vaccinations');
};

// Genéricos para crear, actualizar y eliminar registros
const createRecord = async (req, res, table) => {
  try {
    const record = await userHealthService.createRecord(table, req.body);
    successResponse(res, record, 'Registro creado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const updateRecord = async (req, res, table) => {
  try {
    const { id } = req.params;
    const updatedRecord = await userHealthService.updateRecord(table, id, req.body);
    successResponse(res, updatedRecord, 'Registro actualizado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

const removeRecord = async (req, res, table) => {
  try {
    const { id } = req.params;
    await userHealthService.removeRecord(table, id);
    successResponse(res, null, 'Registro eliminado exitosamente');
  } catch (error) {
    errorResponse(res, error);
  }
};

module.exports = {
  getUserHealthData,
  createMedicalFamilyHistory,
  createHealthData,
  createAllergiesAndMedications,
  createVaccinations,
  getAllergiesByUserId,
  getDisabilitiesByUserId,
  getDiseasesByUserId,
  getDistinctivesByUserId,
  getFamilyHistoryByUserId,
  getMedicalHistoryByUserId,
  getMedicationsByUserId,
  getVaccinationsByUserId,
  createRecord,
  updateRecord,
  removeRecord
};