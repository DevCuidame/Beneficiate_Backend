const GenericRepository = require('../../gen/generic.repository');

const healthConditionsRepository = new GenericRepository('beneficiary_health_conditions');

module.exports = {
  healthConditionsRepository,
};
