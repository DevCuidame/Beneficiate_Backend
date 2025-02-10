const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./health_conditions.controller');

const router = express.Router();

router.use('/health-conditions', createRoutes(controllers.healthConditionsController));

module.exports = router;
