const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./diseases.controller');

const validate = require('../../../middlewares/validate.middleware');
const { beneficiaryDiseaseSchema } = require('./diseases.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryDiseaseSchema), createRecord);
router.put('/update/:id', validate(beneficiaryDiseaseSchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;