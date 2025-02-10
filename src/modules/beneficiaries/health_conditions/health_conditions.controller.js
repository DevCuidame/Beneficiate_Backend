const GenericController = require('../../gen/generic.controller');
const services = require('./health_conditions.service');

const healthConditionsController = new GenericController(
  services.healthConditionsService
);

module.exports = {
  healthConditionsController,
};
