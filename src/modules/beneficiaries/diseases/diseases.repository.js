const GenericRepository = require('../../gen/generic.repository');

const diseasesRepository = new GenericRepository('beneficiary_diseases');

module.exports = {
  diseasesRepository,
};
