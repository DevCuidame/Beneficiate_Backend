const express = require('express');
const router = express.Router();
const { uploadImage, getUserImages, modifyImage, removeImage } = require('./user.image.controller');
const validate = require('../../../middlewares/validate.middleware');
const { imageSchema } = require('./user.images.validation');

router.post('/upload', validate(imageSchema), uploadImage);
router.get('/user/:user_id', getUserImages);
router.put('/update/:id', validate(imageSchema), modifyImage);
router.delete('/remove/:id', removeImage);

module.exports = router;
