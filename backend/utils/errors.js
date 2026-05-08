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

// Trading-specific errors
class TradingError extends AppError {
  constructor(message = 'Trading error', details = null) {
    super(message, 500, 'TRADING_ERROR', details);
  }
}

class InsufficientFundsError extends TradingError {
  constructor(message = 'Insufficient funds', details = null) {
    super(message, 400, 'INSUFFICIENT_FUNDS', details);
  }
}

class SlippageError extends TradingError {
  constructor(message = 'Slippage exceeded limit', details = null) {
    super(message, 400, 'SLIPPAGE_ERROR', details);
  }
}

class TransactionFailedError extends TradingError {
  constructor(message = 'Transaction failed', details = null) {
    super(message, 500, 'TRANSACTION_FAILED', details);
  }
}

// Risk management errors
class RiskError extends AppError {
  constructor(message = 'Risk violation', details = null) {
    super(message, 400, 'RISK_ERROR', details);
  }
}

class RiskLimitExceededError extends RiskError {
  constructor(message = 'Risk limit exceeded', details = null) {
    super(message, 400, 'RISK_LIMIT_EXCEEDED', details);
  }
}

class BlockedTokenError extends RiskError {
  constructor(message = 'Token is blocked', details = null) {
    super(message, 403, 'BLOCKED_TOKEN', details);
  }
}

// Database errors
class DatabaseError extends AppError {
  constructor(message = 'Database error', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

class ConnectionError extends DatabaseError {
  constructor(message = 'Database connection error', details = null) {
    super(message, 503, 'CONNECTION_ERROR', details);
  }
}

// External service errors
class ExternalServiceError extends AppError {
  constructor(message = 'External service error', details = null) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

class RPCError extends ExternalServiceError {
  constructor(message = 'RPC error', details = null) {
    super(message, 502, 'RPC_ERROR', details);
  }
}

class JupiterAPIError extends ExternalServiceError {
  constructor(message = 'Jupiter API error', details = null) {
    super(message, 502, 'JUPITER_API_ERROR', details);
  }
}

class HeliusAPIError extends ExternalServiceError {
  constructor(message = 'Helius API error', details = null) {
    super(message, 502, 'HELIUS_API_ERROR', details);
  }
}

// WebSocket errors
class WebSocketError extends AppError {
  constructor(message = 'WebSocket error', details = null) {
    super(message, 500, 'WEBSOCKET_ERROR', details);
  }
}

class ConnectionClosedError extends WebSocketError {
  constructor(message = 'WebSocket connection closed', details = null) {
    super(message, 410, 'CONNECTION_CLOSED', details);
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
  TradingError,
  InsufficientFundsError,
  SlippageError,
  TransactionFailedError,
  RiskError,
  RiskLimitExceededError,
  BlockedTokenError,
  DatabaseError,
  ConnectionError,
  ExternalServiceError,
  RPCError,
  JupiterAPIError,
  HeliusAPIError,
  WebSocketError,
  ConnectionClosedError,
};
