const GenericController = require('../../gen/generic.controller');
const services = require('./allergies.service');

const allergiesController = new GenericController(services.allergiesService);

module.exports = {
  allergiesController,
};
