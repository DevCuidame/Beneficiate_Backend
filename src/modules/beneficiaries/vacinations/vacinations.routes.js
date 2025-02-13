const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./vacinations.controller');
const validate = require('../../../middlewares/validate.middleware');
const { beneficiaryVaccinationSchema } = require('./vacinations.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryVaccinationSchema), createRecord);
router.put('/update/:id', validate(beneficiaryVaccinationSchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;

