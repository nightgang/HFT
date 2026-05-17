// Comprehensive Error Handling Service
const alertingService = require('../alerting/alerting.service');
const logger = require('../../utils/logger');
const { query } = require('../../db/connection');

class ErrorHandlingService {
  constructor() {
    this.errorCounts = {};
    this.errorThresholds = {
      critical: 10, // Alert after 10 critical errors in an hour
      error: 50,
      warning: 100
    };
  }

  // Initialize error handler
  async initialize() {
    // Set up global error handlers
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection:', {
        reason,
        promise: promise.toString()
      });
      this.recordError('unhandled_rejection', 'critical', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.recordError('uncaught_exception', 'critical', { error });
      // Gracefully shutdown after uncaught exception
      process.exit(1);
    });

    logger.info('Error handling service initialized');
  }

  // Record error to database
  async recordError(errorType, severity = 'error', context = {}, stackTrace = '') {
    try {
      const errorLog = {
        error_type: errorType,
        error_message: context.message || errorType,
        stack_trace: stackTrace || context.stack || '',
        severity,
        context: JSON.stringify(context),
        timestamp: new Date()
      };

      // Add to database
      await query(`
        INSERT INTO error_logs (error_type, error_message, stack_trace, severity, context)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        errorLog.error_type,
        errorLog.error_message,
        errorLog.stack_trace,
        errorLog.severity,
        errorLog.context
      ]);

      // Track error counts for alerting
      this.trackErrorCount(errorType, severity);
    } catch (error) {
      logger.error('Failed to record error:', error);
    }
  }

  // Track error counts and trigger alerts
  trackErrorCount(errorType, severity) {
    const key = `${errorType}_${severity}`;
    this.errorCounts[key] = (this.errorCounts[key] || 0) + 1;

    // Check if threshold exceeded
    if (this.errorCounts[key] > this.errorThresholds[severity]) {
      logger.warn(`ERROR THRESHOLD EXCEEDED: ${errorType} (${severity}) - Count: ${this.errorCounts[key]}`);
      Promise.resolve(
        alertingService.sendAlert(
          this.mapSeverityToAlertSeverity(severity),
          `Error threshold exceeded: ${errorType}`,
          `The ${severity} error \"${errorType}\" has occurred ${this.errorCounts[key]} times.`,
          {
            errorType,
            severity,
            count: this.errorCounts[key]
          }
        )
      ).catch((err) => {
        logger.error('Failed to send threshold alert:', err);
      });
    }
  }

  mapSeverityToAlertSeverity(severity) {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }

  // Create API error response
  createErrorResponse(error, statusCode = 500, request = {}) {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let message = 'An internal error occurred';
    let details = {};

    if (error.isOperational) {
      // Operational error - safe to send to client
      message = error.message;
      statusCode = error.statusCode || 400;
    } else {
      // Programming error - don't leak details
      logger.error('Programming error:', error);
    }

    return {
      success: false,
      error: {
        id: errorId,
        message,
        statusCode,
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? details : undefined
      }
    };
  }

  // Retry logic with exponential backoff
  async retryWithBackoff(fn, maxAttempts = 3, initialDelayMs = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          throw error;
        }

        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms:`, error.message);

        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  // Health check for error service
  async getErrorStats() {
    try {
      const stats = await query(`
        SELECT 
          error_type,
          severity,
          COUNT(*) as count,
          MAX(created_at) as last_error
        FROM error_logs
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY error_type, severity
        ORDER BY count DESC
      `);

      return {
        errors_last_hour: stats.rows,
        total_tracked_errors: this.errorCounts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get error stats:', error);
      return { error: error.message };
    }
  }

  // Clear old error logs (retention policy)
  async cleanupOldErrors(retentionDays = 90) {
    try {
      const result = await query(`
        DELETE FROM error_logs
        WHERE created_at < NOW() - INTERVAL '1 day' * $1
        RETURNING error_id
      `, [retentionDays]);

      logger.info(`Cleaned up ${result.rowCount} old error logs`);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to cleanup error logs:', error);
    }
  }

  // Export errors for analysis
  async exportErrors(startDate, endDate, severity = null) {
    try {
      // eslint-disable-next-line no-unreachable
      let query_text = `
        SELECT * FROM error_logs
        WHERE created_at  BETWEEN $1 AND $2
      `;

      const params = [startDate, endDate];

      if (severity) {
        query_text += ` AND severity = $3`;
        params.push(severity);
      }

      query_text += ` ORDER BY created_at DESC`;

      const result = await query(query_text, params);
      return result.rows;
    } catch (error) {
      logger.error('Failed to export errors:', error);
      return [];
    }
  }
}

module.exports = new ErrorHandlingService();
