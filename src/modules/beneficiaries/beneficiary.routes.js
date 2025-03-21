const express = require('express');
const router = express.Router();
const {
  getBeneficiaryByIdentification,
  getBeneficiariesByUser,
  createBeneficiary,
  updateBeneficiary,
  removeBeneficiary,
  createMedicalFamilyHistory,
  createHealthData,
  createAllergiesAndMedications
} = require('./beneficiary.controller');
const validate = require('../../middlewares/validate.middleware');
const { beneficiarySchema } = require('./beneficiary.validation');
const { medicalAndFamilyHistorySchema } = require('./healthData.validation');
const { healthDataSchema } = require('./healthData.validation');
const { allergiesAndMedicationsSchema } = require('./healthData.validation');
const allergiesRoutes = require('../../modules/beneficiaries/allergies/allergies.routes');
const disabilitiesRoutes = require('../../modules/beneficiaries/disabilities/disabilities.routes');
const diseasesRoutes = require('../../modules/beneficiaries/diseases/diseases.routes');
const distintivesRoutes = require('../../modules/beneficiaries/distintives/distintives.routes');
const familyHistoryRoutes = require('../../modules/beneficiaries/family_history/family_history.routes');
const medicalHistoryRoutes = require('../../modules/beneficiaries/medical_history/medical_history.routes');
const medicationsRoutes = require('../../modules/beneficiaries/medications/medications.routes');
const vaccinationsRoutes = require('../../modules/beneficiaries/vacinations/vacinations.routes');

router.get(
  '/identification/:identification_number',
  getBeneficiaryByIdentification
);
router.get('/user/:user_id', getBeneficiariesByUser);
router.post('/create', validate(beneficiarySchema), createBeneficiary);
router.put('/update/:id', validate(beneficiarySchema), updateBeneficiary);
router.delete('/remove/:id', removeBeneficiary);

router.post('/history/create', validate(medicalAndFamilyHistorySchema), createMedicalFamilyHistory);
router.post('/health-data/create', validate(healthDataSchema), createHealthData);
router.post('/allergies-medications/create', validate(allergiesAndMedicationsSchema), createAllergiesAndMedications);


router.use('/allergies', allergiesRoutes);
router.use('/disabilities', disabilitiesRoutes);
router.use('/diseases', diseasesRoutes);
router.use('/distintives', distintivesRoutes);
router.use('/family-history', familyHistoryRoutes);
router.use('/medical-history', medicalHistoryRoutes);
router.use('/medications', medicationsRoutes);
router.use('/vaccinations', vaccinationsRoutes);

module.exports = router;
