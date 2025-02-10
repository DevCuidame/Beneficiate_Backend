const GenericController = require('../../gen/generic.controller');
const services = require('./diseases.service');

const diseasesController = new GenericController(services.diseasesService);

module.exports = {
  diseasesController,
};
