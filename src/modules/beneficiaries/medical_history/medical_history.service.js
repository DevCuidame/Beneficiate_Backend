const GenericService = require('../../gen/generic.service');
const repositories = require('./medical_history.repository');

const medicalHistoryService = new GenericService(repositories.medicalHistoryRepository);

module.exports = {
  medicalHistoryService,
};
