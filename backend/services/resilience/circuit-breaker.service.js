// Circuit Breaker Pattern Implementation for API Resilience
const logger = require('../../utils/logger');
const { query } = require('../../db/connection');

class CircuitBreakerService {
  constructor() {
    this.breakers = new Map();
    this.defaultConfig = {
      failureThreshold: 5, // Failures before opening circuit
      resetTimeout: 60000, // 1 minute
      halfOpenMaxAttempts: 2,
      monitoringInterval: 10000
    };
  }

  // Initialize a circuit breaker for a service
  initializeBreaker(serviceName, config = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };

    const breaker = {
      serviceName,
      state: 'closed', // closed, open, half-open
      failureCount: 0,
      successCount: 0,
      lastFailureTime: null,
      resetTime: null,
      config: finalConfig,
      requestCount: 0,
      errorRate: 0
    };

    this.breakers.set(serviceName, breaker);
    logger.info(`Circuit breaker initialized for ${serviceName}`, finalConfig);

    return breaker;
  }

  // Get or create a breaker
  getBreaker(serviceName, config) {
    if (!this.breakers.has(serviceName)) {
      this.initializeBreaker(serviceName, config);
    }
    return this.breakers.get(serviceName);
  }

  // Execute function with circuit breaker protection
  async execute(serviceName, fn, config) {
    const breaker = this.getBreaker(serviceName, config);

    // Check current state
    if (breaker.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - breaker.lastFailureTime > breaker.config.resetTimeout) {
        logger.info(`Circuit breaker ${serviceName} transitioning to half-open`);
        breaker.state = 'half-open';
        breaker.successCount = 0;
      } else {
        throw new Error(`Circuit breaker for ${serviceName} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.recordSuccess(serviceName);
      return result;
    } catch (error) {
      this.recordFailure(serviceName);
      throw error;
    }
  }

  // Record successful request
  recordSuccess(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (!breaker) return;

    if (breaker.state === 'half-open') {
      breaker.successCount++;
      if (breaker.successCount >= breaker.config.halfOpenMaxAttempts) {
        logger.info(`Circuit breaker ${serviceName} transitioning to CLOSED`);
        breaker.state = 'closed';
        breaker.failureCount = 0;
        breaker.successCount = 0;
      }
    } else if (breaker.state === 'closed') {
      // Reset failure count on success
      breaker.failureCount = Math.max(0, breaker.failureCount - 1);
    }

    // Update metrics
    breaker.requestCount++;
    breaker.errorRate = breaker.failureCount / Math.max(breaker.requestCount, 1);
  }

  // Record failed request
  recordFailure(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (!breaker) return;

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.state === 'half-open') {
      logger.warn(`Circuit breaker ${serviceName} transitioning back to OPEN`);
      breaker.state = 'open';
    } else if (breaker.state === 'closed' && breaker.failureCount >= breaker.config.failureThreshold) {
      logger.warn(`Circuit breaker ${serviceName} transitioning to OPEN after ${breaker.failureCount} failures`);
      breaker.state = 'open';
    }

    // Update metrics
    breaker.requestCount++;
    breaker.errorRate = breaker.failureCount / Math.max(breaker.requestCount, 1);

    // Log to database
    this.logBreakerState(serviceName, breaker);
  }

  // Log circuit breaker state to database
  async logBreakerState(serviceName, breaker) {
    try {
      await query(`
        INSERT INTO circuit_breaker_state 
        (service_name, state, failure_count, last_failure_at, metadata)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (service_name) DO UPDATE SET
          state = EXCLUDED.state,
          failure_count = EXCLUDED.failure_count,
          last_failure_at = EXCLUDED.last_failure_at
      `, [
        serviceName,
        breaker.state,
        breaker.failureCount,
        new Date(breaker.lastFailureTime),
        JSON.stringify({
          error_rate: breaker.errorRate,
          request_count: breaker.requestCount,
          reset_time: breaker.config.resetTimeout
        })
      ]);
    } catch (error) {
      logger.debug('Could not log circuit breaker state:', error.message);
    }
  }

  // Get breaker status
  getStatus(serviceName) {
    if (!this.breakers.has(serviceName)) {
      return null;
    }

    const breaker = this.breakers.get(serviceName);
    return {
      serviceName,
      state: breaker.state,
      failureCount: breaker.failureCount,
      errorRate: breaker.errorRate.toFixed(2),
      requestCount: breaker.requestCount,
      lastFailureTime: breaker.lastFailureTime
    };
  }

  // Get all breakers status
  getAllStatus() {
    const status = {};
    for (const [serviceName, breaker] of this.breakers.entries()) {
      status[serviceName] = this.getStatus(serviceName);
    }
    return status;
  }

  // Reset a breaker
  reset(serviceName) {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      breaker.state = 'closed';
      breaker.failureCount = 0;
      breaker.successCount = 0;
      breaker.lastFailureTime = null;
      logger.info(`Circuit breaker ${serviceName} manually reset`);
    }
  }

  // Reset all breakers
  resetAll() {
    for (const serviceName of this.breakers.keys()) {
      this.reset(serviceName);
    }
    logger.info('All circuit breakers reset');
  }
}

module.exports = new CircuitBreakerService();
