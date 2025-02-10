const GenericRepository = require('../../gen/generic.repository');

const emergencyContactsRepository = new GenericRepository('user_emergency_contacts');

module.exports = {
  emergencyContactsRepository
};
