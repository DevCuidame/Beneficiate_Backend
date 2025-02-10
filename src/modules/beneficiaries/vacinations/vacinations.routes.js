const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./vacinations.controller');

const router = express.Router();

router.use('/vaccinations', createRoutes(controllers.vaccinationsController));

module.exports = router;
