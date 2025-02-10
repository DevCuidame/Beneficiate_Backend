const GenericService = require('../../gen/generic.service');
const repositories = require('./diseases.repository');

const diseasesService = new GenericService(repositories.diseasesRepository);

module.exports = {
  diseasesService,
};
