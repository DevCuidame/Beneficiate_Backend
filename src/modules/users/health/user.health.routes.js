const express = require('express');
const router = express.Router();
const {
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
  getVaccinationsByUserId
} = require('./user.health.controller');
const validate = require('../../../middlewares/validate.middleware');
const {
  userMedicalAndFamilyHistorySchema,
  userHealthDataSchema,
  userAllergiesAndMedicationsSchema,
  userVaccinationsSchema
} = require('./user.health.validation');

router.get('/:user_id', getUserHealthData);

// Routes for bulk operations
router.post('/history/create', validate(userMedicalAndFamilyHistorySchema), createMedicalFamilyHistory);
router.post('/health-data/create', validate(userHealthDataSchema), createHealthData);
router.post('/allergies-medications/create', validate(userAllergiesAndMedicationsSchema), createAllergiesAndMedications);
router.post('/vaccinations/create', validate(userVaccinationsSchema), createVaccinations);

// Routes for getting specific health data types
router.get('/allergies/:user_id', getAllergiesByUserId);
router.get('/disabilities/:user_id', getDisabilitiesByUserId);
router.get('/diseases/:user_id', getDiseasesByUserId);
router.get('/distinctives/:user_id', getDistinctivesByUserId);
router.get('/family-history/:user_id', getFamilyHistoryByUserId);
router.get('/medical-history/:user_id', getMedicalHistoryByUserId);
router.get('/medications/:user_id', getMedicationsByUserId);
router.get('/vaccinations/:user_id', getVaccinationsByUserId);

// Include sub-routes for individual record management
const vaccinationsRoutes = require('../vaccinations/vaccinations.routes');

router.use('/vaccinations', vaccinationsRoutes);

module.exports = router;