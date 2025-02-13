const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./family_history.controller');
const validate = require('../../../middlewares/validate.middleware');

const { beneficiaryFamilyHistorySchema } = require('./family_history.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryFamilyHistorySchema), createRecord);
router.put('/update/:id', validate(beneficiaryFamilyHistorySchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;