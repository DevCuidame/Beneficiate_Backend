const express = require('express');
const router = express.Router();
const {
  getMedicalSpecialtyById,
  getAll,
  createMedicalSpecialty,
  updateMedicalSpecialty,
  deleteMedicalSpecialty
} = require('./medical_specialties.controller');
const validate = require('../../middlewares/validate.middleware');
// const { medicalSpecialtySchema } = require('./medicalSpecialty.validation');

router.get('/id/:id', getMedicalSpecialtyById);
router.get('/all', getAll);
router.post('/create', createMedicalSpecialty);
router.put('/update/:id', updateMedicalSpecialty);
router.delete('/remove/:id', deleteMedicalSpecialty);

module.exports = router;
