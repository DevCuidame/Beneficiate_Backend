const GenericService = require('../../gen/generic.service');
const repositories = require('./vacinations.repository');

const vaccinationsService = new GenericService(repositories.vaccinationsRepository);

module.exports = {
  vaccinationsService,
};
