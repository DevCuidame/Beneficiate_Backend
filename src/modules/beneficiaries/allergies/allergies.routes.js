const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./allergies.controller');
const validate = require('../../../middlewares/validate.middleware');
const { beneficiaryAllergySchema } = require('./allergies.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryAllergySchema), createRecord);
router.put('/update/:id', validate(beneficiaryAllergySchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;