// Request Logging and Monitoring Middleware
const logger = require('../utils/logger');
const monitoringService = require('../services/monitoring/monitoring.service');
const { query } = require('../db/connection');

// Request ID middleware
function requestIdMiddleware(req, res, next) {
  req.id = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
}

// Request logging middleware
function requestLoggingMiddleware(req, res, next) {
  const start = Date.now();

  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // Log request
    logger.info('HTTP Request', {
      request_id: req.id,
      method: req.method,
      path: req.path,
      status: statusCode,
      duration_ms: duration,
      user_agent: req.get('user-agent'),
      client_ip: req.ip
    });

    // Record metrics
    try {
      monitoringService.recordAPIRequest(req.method, req.path, statusCode, duration);
    } catch (error) {
      logger.debug('Failed to record metrics:', error.message);
    }

    // Store in database - with better error handling
    if (res.storeRequestLog) {
      res.storeRequestLog(req, statusCode, duration).catch(err => {
        logger.debug('Failed to store request log:', err.message);
      });
    }

    return originalJson(data);
  };

  // Store request log method
  res.storeRequestLog = async function(req, statusCode, duration) {
    try {
      // Check if request log table exists and is writable
      // Skip logging for very frequent endpoints to prevent log table from growing too fast
      if (req.path === '/health' || req.path === '/metrics' || req.path === '/healthz/live' || req.path === '/healthz/ready') {
        return; // Don't log health checks
      }

      await query(`
        INSERT INTO api_request_logs (method, path, status_code, response_time_ms, client_ip, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        req.method,
        req.path,
        statusCode,
        duration,
        req.ip,
        req.get('user-agent')
      ]);
    } catch (error) {
      // Log table might not exist or query might fail - don't crash
      logger.debug('Could not store request log:', error.message);
    }
  };

  next();
}

// Error handling middleware
function errorHandlingMiddleware(err, req, res, next) {
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  logger.error('Request Error', {
    error_id: errorId,
    request_id: req.id,
    method: req.method,
    path: req.path,
    status: statusCode,
    message,
    stack: err.stack,
    user_agent: req.get('user-agent'),
    client_ip: req.ip
  });

  // Record error
  try {
    monitoringService.recordError(err.name || 'Unknown Error', 'error');
  } catch (error) {
    logger.debug('Failed to record error metric:', error.message);
  }

  // Don't leak internal error details to client
  if (statusCode >= 500) {
    message = 'An internal server error occurred';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      id: errorId,
      request_id: req.id,
      message,
      timestamp: new Date().toISOString()
    }
  });
}

// Health check endpoint middleware
async function healthCheckHandler(req, res) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {}
    };

    // Database check
    try {
      const dbCheck = await monitoringService.checkDatabaseHealth();
      health.checks.database = dbCheck;
    } catch (error) {
      health.checks.database = { status: 'unhealthy', error: error.message };
      health.status = 'degraded';
    }

    // Memory check
    health.checks.memory = await monitoringService.checkMemoryHealth();
    if (health.checks.memory.status === 'degraded') {
      health.status = 'degraded';
    }

    // API check
    health.checks.api = await monitoringService.checkAPIHealth();

    const statusCode = health.status === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Readiness probe
async function readinessProbeHandler(req, res) {
  try {
    // Quick check that core services are ready
    const dbCheck = await monitoringService.checkDatabaseHealth();

    if (dbCheck.status === 'healthy') {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        ready: false,
        error: dbCheck.error || 'Database not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Liveness probe
function livenessProbeHandler(req, res) {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}

module.exports = {
  requestIdMiddleware,
  requestLoggingMiddleware,
  errorHandlingMiddleware,
  healthCheckHandler,
  readinessProbeHandler,
  livenessProbeHandler
};
