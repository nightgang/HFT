const logger = require('../utils/logger');

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.nextAttemptTime = null;
  }

  async execute(operation, fallback = null) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        logger.warn('Circuit breaker is OPEN, rejecting request');
        if (fallback) return fallback();
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker moving to HALF_OPEN state');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'CLOSED';
        this.successCount = 0;
        logger.info('Circuit breaker CLOSED after successful operations');
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      logger.warn('Circuit breaker OPEN due to failure in HALF_OPEN state');
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      logger.warn(`Circuit breaker OPEN after ${this.failureCount} failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttemptTime: this.nextAttemptTime,
      timeUntilRetry: this.nextAttemptTime ? Math.max(0, this.nextAttemptTime - Date.now()) : 0
    };
  }
}

class ExponentialBackoff {
  constructor(options = {}) {
    this.initialDelay = options.initialDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 30000; // 30 seconds
    this.multiplier = options.multiplier || 2;
    this.jitter = options.jitter !== false; // Add randomness by default
  }

  async execute(operation, maxRetries = 3) {
    let attempt = 0;
    let delay = this.initialDelay;

    while (attempt <= maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;

        if (attempt > maxRetries) {
          logger.error(`Operation failed after ${maxRetries} retries:`, error);
          throw error;
        }

        logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error.message);

        await this.sleep(delay);
        delay = Math.min(delay * this.multiplier, this.maxDelay);

        if (this.jitter) {
          delay = delay * (0.5 + Math.random() * 0.5); // Add up to 50% jitter
        }
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class GracefulShutdown {
  constructor() {
    this.handlers = [];
    this.isShuttingDown = false;
  }

  registerHandler(handler) {
    this.handlers.push(handler);
  }

  async shutdown(signal) {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    logger.info(`Received ${signal}, initiating graceful shutdown...`);

    // Execute all registered handlers
    const shutdownPromises = this.handlers.map(async (handler, index) => {
      try {
        await handler();
        logger.info(`Shutdown handler ${index + 1} completed`);
      } catch (error) {
        logger.error(`Shutdown handler ${index + 1} failed:`, error);
      }
    });

    try {
      await Promise.all(shutdownPromises);
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Graceful shutdown failed:', error);
      process.exit(1);
    }
  }

  isShuttingDown() {
    return this.isShuttingDown;
  }
}

// Global instances
const rpcCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 30000 // 30 seconds
});

const jupiterCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 60000 // 1 minute
});

const backoff = new ExponentialBackoff({
  initialDelay: 1000,
  maxDelay: 10000,
  multiplier: 2
});

const shutdownManager = new GracefulShutdown();

module.exports = {
  CircuitBreaker,
  ExponentialBackoff,
  GracefulShutdown,
  rpcCircuitBreaker,
  jupiterCircuitBreaker,
  backoff,
  shutdownManager
};