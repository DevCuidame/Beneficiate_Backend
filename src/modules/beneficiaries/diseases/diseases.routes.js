const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./diseases.controller');

const router = express.Router();

router.use('/diseases', createRoutes(controllers.diseasesController));

module.exports = router;
