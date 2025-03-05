// core/errors.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

const handleErrors = (err, req, res, next) => {
  console.error(`[${err.timestamp}] ${err.message}`);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
    timestamp: err.timestamp,
  });
};


class PaymentError extends Error {
  constructor(message, code = 'PAYMENT_ERROR') {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
  }
}

class TransactionError extends PaymentError {
  constructor(message) {
    super(message, 'TRANSACTION_ERROR');
  }
}

class InsufficientFundsError extends PaymentError {
  constructor() {
    super('Fondos insuficientes', 'INSUFFICIENT_FUNDS');
  }
}

class PaymentDeclinedError extends PaymentError {
  constructor() {
    super('Pago rechazado', 'PAYMENT_DECLINED');
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  handleErrors,
  PaymentError,
  TransactionError,
  InsufficientFundsError,
  PaymentDeclinedError
};
