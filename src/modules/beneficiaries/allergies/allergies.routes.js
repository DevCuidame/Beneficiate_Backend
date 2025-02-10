const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./allergies.controller');

const router = express.Router();

router.use('/allergies', createRoutes(controllers.allergiesController));

module.exports = router;
