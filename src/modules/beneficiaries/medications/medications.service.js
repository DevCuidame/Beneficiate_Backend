const GenericService = require('../../gen/generic.service');
const repositories = require('./medications.repository');

const medicationsService = new GenericService(repositories.medicationsRepository);

module.exports = {
  medicationsService,
};
