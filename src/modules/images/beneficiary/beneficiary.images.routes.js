const express = require('express');
const router = express.Router();
const { uploadImage, getBeneficiaryImages, modifyImage, removeImage } = require('./beneficiary.image.controller');
const validate = require('../../../middlewares/validate.middleware');
const { imageSchema } = require('./beneficiary.images.validation');

router.post('/upload', validate(imageSchema), uploadImage);
router.get('/user/:user_id', getBeneficiaryImages);
router.put('/update/:id', validate(imageSchema), modifyImage);
router.delete('/remove/:id', removeImage);

module.exports = router;
