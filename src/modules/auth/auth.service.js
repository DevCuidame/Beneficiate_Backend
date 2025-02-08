// modules/auth/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('../../utils/jwt');
const authRepository = require('./auth.repository');
const { UnauthorizedError, ValidationError } = require('../../core/errors');

const login = async (email, password) => {
  const user = await authRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('Credenciales Inválidas');
  }
  return jwt.generateToken({ id: user.id, email: user.email });
};

const register = async (userData) => {
  const existingUser = await authRepository.findByEmail(userData.email);
  if (existingUser) {
    throw new ValidationError('No logramos registrar tu email');
  }

  const existingIdentification = await authRepository.findByIdentification(
    userData.identification
  );
  if (existingIdentification) {
    throw new ValidationError('No logramos registrar tu número de identificación');
  }

  userData.verified = false;
  userData.plan_id = 1;

  userData.password = await bcrypt.hash(userData.password, 10);
  return authRepository.createUser(userData);
};

module.exports = { login, register };
