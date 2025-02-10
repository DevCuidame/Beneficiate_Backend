const GenericController = require('../../gen/generic.controller');
const services = require('./contacts.service');

const emergencyContactsController = new GenericController(services.emergencyContactsService);

module.exports = {
  emergencyContactsController
};
