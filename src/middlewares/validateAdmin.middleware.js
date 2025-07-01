const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../core/errors');
require('dotenv').config();

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token no proporcionado o Acceso restringido'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificamos si es administrador
    if (!decoded.admin) {
      return next(new UnauthorizedError('Acceso restringido a administradores'));
    }

    req.user = decoded;
    req.isAdmin = true;

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

module.exports = authenticateAdmin;
