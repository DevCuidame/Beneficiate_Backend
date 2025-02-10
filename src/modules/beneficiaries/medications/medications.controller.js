const GenericController = require('../../gen/generic.controller');
const services = require('./medications.service');

const medicationsController = new GenericController(services.medicationsService);

module.exports = {
  medicationsController,
};
