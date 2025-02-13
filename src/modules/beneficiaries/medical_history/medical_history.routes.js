const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./medical_history.controller');
const validate = require('../../../middlewares/validate.middleware');

const { beneficiaryMedicalHistorySchema } = require('./medical_history.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryMedicalHistorySchema), createRecord);
router.put('/update/:id', validate(beneficiaryMedicalHistorySchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;