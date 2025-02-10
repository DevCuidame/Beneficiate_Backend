const GenericRepository = require('../../gen/generic.repository');

const medicationsRepository = new GenericRepository('beneficiary_medications');

module.exports = {
  medicationsRepository,
};
