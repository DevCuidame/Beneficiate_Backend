const GenericController = require('../../gen/generic.controller');
const services = require('./family_history.service');

const familyHistoryController = new GenericController(services.familyHistoryService);

module.exports = {
  familyHistoryController,
};
