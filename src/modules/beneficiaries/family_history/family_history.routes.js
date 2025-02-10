const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./family_history.controller');

const router = express.Router();

router.use('/family-history', createRoutes(controllers.familyHistoryController));

module.exports = router;
