const GenericController = require('../../gen/generic.controller');
const services = require('./vacinations.service');

const vaccinationsController = new GenericController(services.vaccinationsService);

module.exports = {
  medicationsController,
};
