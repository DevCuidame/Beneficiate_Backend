const GenericService = require('../../gen/generic.service');
const repositories = require('./health_conditions.repository');

const healthConditionsService = new GenericService(repositories.healthConditionsRepository);

module.exports = {
  healthConditionsService,
};
