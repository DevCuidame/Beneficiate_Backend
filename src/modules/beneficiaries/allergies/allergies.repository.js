const GenericRepository = require('../../gen/generic.repository');

const allergiesRepository = new GenericRepository('beneficiary_allergies');

module.exports = { allergiesRepository };
