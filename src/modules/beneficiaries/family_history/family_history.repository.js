const GenericRepository = require('../../gen/generic.repository');

const familyHistoryRepository = new GenericRepository('beneficiary_family_history');

module.exports = {
  familyHistoryRepository,
};
