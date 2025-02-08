const express = require('express');
const router = express.Router();
const { getBeneficiaryByIdentification, getBeneficiariesByUser, createBeneficiary, updateBeneficiary, removeBeneficiary } = require('./beneficiary.controller');
const validate = require('../../middlewares/validate.middleware');
const { beneficiarySchema } = require('./beneficiary.validation');

router.get('/identification/:identification_number', getBeneficiaryByIdentification);
router.get('/user/:user_id', getBeneficiariesByUser);
router.post('/create', validate(beneficiarySchema), createBeneficiary);
router.put('/update/:id', validate(beneficiarySchema), updateBeneficiary);
router.delete('/remove/:id', removeBeneficiary);

module.exports = router;
