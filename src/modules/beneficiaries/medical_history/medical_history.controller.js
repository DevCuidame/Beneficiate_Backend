const GenericController = require('../../gen/generic.controller');
const services = require('./medical_history.service');

const medicalHistoryController = new GenericController(services.medicalHistoryService);

module.exports = {
  medicalHistoryController,
};
