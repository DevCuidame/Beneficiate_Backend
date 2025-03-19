const express = require('express');
const router = express.Router();
const {
  getMedicalProfessionalById,
  getMedicalProfessionalByUserId,
  createMedicalProfessional,
  updateMedicalProfessional,
  deleteMedicalProfessional,
  getAll,
  getMedicalProfessionalsBySpecialtyId,
  updateScheduleType
} = require('./medicalProfessional.controller');
const validate = require('../../middlewares/validate.middleware');
const { medicalProfessionalSchema } = require('./medicalProfessional.validation');

router.get('/id/:id', getMedicalProfessionalById);
router.get('/all', getAll);
router.get('/user/:user_id', getMedicalProfessionalByUserId);
router.get('/user/:user_id', getMedicalProfessionalByUserId);
router.post('/create', validate(medicalProfessionalSchema), createMedicalProfessional);
router.put('/update/:id', validate(medicalProfessionalSchema), updateMedicalProfessional);
router.delete('/remove/:id', deleteMedicalProfessional);

router.get('/specialty/:specialty_id', getMedicalProfessionalsBySpecialtyId);
router.put('/schedule-type/:id', updateScheduleType);


module.exports = router;
