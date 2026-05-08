class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Invalid request', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Authorization failed', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict detected', details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

class ServiceError extends AppError {
  constructor(message = 'Service error', details = null) {
    super(message, 502, 'SERVICE_ERROR', details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServiceError,
};
