const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./medications.controller');
const validate = require('../../../middlewares/validate.middleware');

const { beneficiaryMedicationSchema } = require('./medications.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryMedicationSchema), createRecord);
router.put('/update/:id', validate(beneficiaryMedicationSchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;