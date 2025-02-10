const GenericService = require('../../gen/generic.service');
const repositories = require('./allergies.repository');

const allergiesService = new GenericService(repositories.allergiesRepository);

module.exports = { allergiesService };
