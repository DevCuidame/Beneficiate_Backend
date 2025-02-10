const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./medications.controller');

const router = express.Router();

router.use('/medications', createRoutes(controllers.medicationsController));

module.exports = router;
