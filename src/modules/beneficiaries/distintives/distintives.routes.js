const express = require('express');
const router = express.Router();
const { getByBeneficiaryId, createRecord, updateRecord, removeRecord } = require('./distintives.controller');
const validate = require('../../../middlewares/validate.middleware');

const { beneficiaryDistintiveSchema } = require('./distintives.validation');

router.get('/beneficiary/:beneficiary_id', getByBeneficiaryId);
router.post('/create', validate(beneficiaryDistintiveSchema), createRecord);
router.put('/update/:id', validate(beneficiaryDistintiveSchema), updateRecord);
router.delete('/remove/:id', removeRecord);

module.exports = router;