const GenericService = require('../../gen/generic.service');
const repositories = require('./contacts.repository');

const emergencyContactsService = new GenericService(repositories.emergencyContactsRepository);

module.exports = {
  emergencyContactsService
};
