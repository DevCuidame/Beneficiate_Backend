const express = require('express');
const createRoutes = require('../../gen/generic.routes');
const controllers = require('./contacts.controller');

const router = express.Router();

router.use('/emergency-contacts', createRoutes(controllers.emergencyContactsController));

module.exports = router;
