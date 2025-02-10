const GenericService = require('../../gen/generic.service');
const repositories = require('./family_history.repository');

const familyHistoryService = new GenericService(repositories.familyHistoryRepository);

module.exports = {
  familyHistoryService,
};
