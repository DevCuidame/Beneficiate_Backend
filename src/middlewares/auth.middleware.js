// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../core/errors');
require('dotenv').config();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token no proporcionado o formato incorrecto'));
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('El token ha expirado'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido'));
    } else {
      return next(new UnauthorizedError('Error en la autenticación'));
    }
  }
};

module.exports = authenticate;
