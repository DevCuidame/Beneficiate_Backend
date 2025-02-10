const GenericRepository = require('../../gen/generic.repository');

const vaccinationsRepository = new GenericRepository('beneficiary_vaccinations');

module.exports = {
  vaccinationsRepository,
};
