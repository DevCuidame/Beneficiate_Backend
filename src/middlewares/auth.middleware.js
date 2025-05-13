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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Guardar la información decodificada en req
    req.user = decoded;
    
    // Añadir propiedades específicas para facilitar verificaciones
    req.isUser = decoded.accountType === 'user';
    req.isBeneficiary = decoded.accountType === 'beneficiary';
    
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
