const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./disabilities.controller');
const validate = require('../../../middlewares/validate.middleware');
const { beneficiaryDisabilitySchema } = require('./disabilities.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryDisabilitySchema), createRecord);
router.put('/update/:id', validate(beneficiaryDisabilitySchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;