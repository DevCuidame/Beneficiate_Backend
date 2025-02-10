const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./medical_history.controller');

const router = express.Router();

router.use('/medical-history', createRoutes(controllers.medicalHistoryController));

module.exports = router;
