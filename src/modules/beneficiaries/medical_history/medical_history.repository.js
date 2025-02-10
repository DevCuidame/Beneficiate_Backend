const GenericRepository = require('../../gen/generic.repository');

const medicalHistoryRepository = new GenericRepository('beneficiary_medical_history');

module.exports = {
  medicalHistoryRepository,
};
