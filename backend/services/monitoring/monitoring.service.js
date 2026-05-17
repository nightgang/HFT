// Monitoring and Metrics Service for HFT System
const promClient = require('prom-client');
const logger = require('../../utils/logger');
const metricsService = require('./metrics.service');
const { query, pool } = require('../../db/connection');

class MonitoringService {
  constructor() {
    this.initialized = false;
    this.metrics = {};
    this.healthStatus = {};
  }

  // Initialize Prometheus metrics
  async initialize() {
    if (this.initialized) return;

    try {
      // Set up default metrics (CPU, memory, etc.)
      promClient.collectDefaultMetrics({ timeout: 5000 });

      // Custom metrics for trading system
      this.metrics = {
        // Trade execution metrics
        tradeExecutionDuration: new promClient.Histogram({
          name: 'trade_execution_duration_ms',
          help: 'Time taken to execute a trade in milliseconds',
          buckets: [100, 500, 1000, 2000, 5000, 10000],
          labelNames: ['strategy', 'status']
        }),

        tradeExecutionTotal: new promClient.Counter({
          name: 'trades_total',
          help: 'Total number of trades executed',
          labelNames: ['strategy', 'status']
        }),

        // Risk engine metrics
        riskViolationsTotal: new promClient.Counter({
          name: 'risk_violations_total',
          help: 'Total number of risk violations detected',
          labelNames: ['violation_type']
        }),

        positionSizeGauge: new promClient.Gauge({
          name: 'position_size_usd',
          help: 'Current position size in USD',
          labelNames: ['wallet', 'token']
        }),

        // API metrics
        apiRequestDuration: new promClient.Histogram({
          name: 'api_request_duration_ms',
          help: 'API request duration in milliseconds',
          buckets: [10, 50, 100, 200, 500, 1000, 2000],
          labelNames: ['method', 'path', 'status']
        }),

        apiRequestsTotal: new promClient.Counter({
          name: 'api_requests_total',
          help: 'Total number of API requests',
          labelNames: ['method', 'path', 'status']
        }),

        // Database metrics
        dbQueryDuration: new promClient.Histogram({
          name: 'db_query_duration_ms',
          help: 'Database query duration in milliseconds',
          buckets: [1, 5, 10, 50, 100, 500, 1000],
          labelNames: ['operation', 'status']
        }),

        dbConnectionPoolSize: new promClient.Gauge({
          name: 'db_connection_pool_size',
          help: 'Current database connection pool size',
          labelNames: []
        }),

        // System health
        systemUptime: new promClient.Gauge({
          name: 'system_uptime_seconds',
          help: 'System uptime in seconds',
          labelNames: []
        }),

        // Error metrics
        errorsTotal: new promClient.Counter({
          name: 'errors_total',
          help: 'Total number of errors',
          labelNames: ['error_type', 'severity']
        }),

        // Rate limiting
        rateLimitHitsTotal: new promClient.Counter({
          name: 'rate_limit_hits_total',
          help: 'Total number of rate limit hits',
          labelNames: ['endpoint']
        }),

        predictiveAlertsTotal: new promClient.Counter({
          name: 'predictive_alerts_total',
          help: 'Total number of predictive alerts created or acknowledged',
          labelNames: ['action', 'severity']
        }),

        // WebSocket metrics
        websocketConnectionsActive: new promClient.Gauge({
          name: 'websocket_connections_active',
          help: 'Active WebSocket connections',
          labelNames: []
        }),

        websocketMessagesTotal: new promClient.Counter({
          name: 'websocket_messages_total',
          help: 'Total WebSocket messages sent/received',
          labelNames: ['direction', 'type']
        })
      };

      // Periodic metrics update
      setInterval(() => this.updateSystemMetrics(), 60000);

      this.initialized = true;
      logger.info('Monitoring service initialized');
    } catch (error) {
      logger.error('Failed to initialize monitoring service:', error);
    }
  }

  // Update system metrics periodically
  async updateSystemMetrics() {
    try {
      // Update uptime
      const uptime = process.uptime();
      this.metrics.systemUptime.set(uptime);

      // Update database pool size if available
      if (pool && typeof pool.totalCount === 'number') {
        this.metrics.dbConnectionPoolSize.set(pool.totalCount);
      }

      // Update health status and associated metrics
      await this.checkHealth();
    } catch (error) {
      logger.error('Failed to update system metrics:', error);
    }
  }

  // Check system health
  async checkHealth() {
    const health = {
      database: await this.checkDatabaseHealth(),
      memory: await this.checkMemoryHealth(),
      api: await this.checkAPIHealth(),
      timestamp: new Date().toISOString()
    };

    // Determine overall status
    health.status = health.database.status === 'healthy' && health.memory.status === 'healthy' && health.api.status === 'healthy'
      ? 'healthy'
      : 'degraded';

    this.healthStatus = health;

    metricsService.updateHealthCheckStatus('database', health.database.status === 'healthy');
    metricsService.updateHealthCheckStatus('memory', health.memory.status === 'healthy');
    metricsService.updateHealthCheckStatus('api', health.api.status === 'healthy');
    metricsService.updateHealthCheckStatus('overall', health.status === 'healthy');

    // Store health check in database
    try {
      await query(`
        INSERT INTO health_checks (service_name, status, details)
        VALUES ($1, $2, $3)
      `, ['system', health.status, JSON.stringify(health)]);
    } catch (error) {
      logger.debug('Could not store health check:', error.message);
    }

    return health;
  }

  // Check database health
  async checkDatabaseHealth() {
    const start = Date.now();
    try {
      const result = await query('SELECT 1');
      const latency = Date.now() - start;
      this.metrics.dbQueryDuration.observe({ operation: 'health_check', status: 'success' }, latency);
      return {
        status: 'healthy',
        latency_ms: latency,
        message: 'Database connection successful'
      };
    } catch (error) {
      const latency = Date.now() - start;
      this.metrics.dbQueryDuration.observe({ operation: 'health_check', status: 'error' }, latency);
      return {
        status: 'unhealthy',
        error: error.message,
        message: 'Database connection failed'
      };
    }
  }

  // Check memory health
  async checkMemoryHealth() {
    const usage = process.memoryUsage();
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    // Use a more reasonable threshold for Node.js applications
    // 95% is too strict for typical Node.js heap usage
    const isDegraded = heapUsagePercent > 95;

    return {
      status: isDegraded ? 'degraded' : 'healthy',
      heap_used_mb: Math.round(usage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(usage.heapTotal / 1024 / 1024),
      heap_usage_percent: Math.round(heapUsagePercent),
      external_mb: Math.round(usage.external / 1024 / 1024)
    };
  }

  // Check API health
  async checkAPIHealth() {
    const lastHour = new Date(Date.now() - 3600000);
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status_code >= 500 THEN 1 END) as error_count,
          AVG(response_time_ms) as avg_response_time
        FROM api_request_logs
        WHERE created_at > $1
      `, [lastHour]);

      const data = result.rows[0];
      const errorRate = data.total_requests > 0 ? (data.error_count / data.total_requests) * 100 : 0;

      return {
        status: errorRate > 5 ? 'degraded' : 'healthy',
        total_requests: parseInt(data.total_requests),
        error_count: parseInt(data.error_count),
        error_rate_percent: Math.round(errorRate),
        avg_response_time_ms: Math.round(data.avg_response_time || 0)
      };
    } catch (error) {
      logger.debug('Could not check API health:', error.message);
      return { status: 'unknown', error: error.message };
    }
  }

  // Record trade execution metric
  recordTradeExecution(strategy, status, durationMs) {
    this.metrics.tradeExecutionDuration.observe(
      { strategy, status },
      durationMs
    );
    this.metrics.tradeExecutionTotal.inc({ strategy, status });
  }

  // Record risk violation
  recordRiskViolation(violationType) {
    this.metrics.riskViolationsTotal.inc({ violation_type: violationType });
  }

  // Record API request
  recordAPIRequest(method, path, statusCode, durationMs) {
    this.metrics.apiRequestDuration.observe(
      { method, path, status: statusCode },
      durationMs
    );
    this.metrics.apiRequestsTotal.inc({ method, path, status: statusCode });
  }

  // Record database query
  recordDatabaseQuery(operation, durationMs, success = true) {
    this.metrics.dbQueryDuration.observe(
      { operation, status: success ? 'success' : 'error' },
      durationMs
    );
  }

  // Record error
  recordError(errorType, severity = 'error') {
    this.metrics.errorsTotal.inc({ error_type: errorType, severity });
  }

  // Record rate limit hit
  recordRateLimitHit(endpoint) {
    this.metrics.rateLimitHitsTotal.inc({ endpoint });
  }

  // Record predictive alert events
  recordPredictiveAlert(action, severity = 'unknown') {
    if (this.metrics.predictiveAlertsTotal) {
      this.metrics.predictiveAlertsTotal.inc({ action, severity });
    }
  }

  // Update WebSocket connections
  updateWebSocketConnections(activeConnections) {
    this.metrics.websocketConnectionsActive.set(activeConnections);
  }

  // Record WebSocket message
  recordWebSocketMessage(direction, messageType) {
    this.metrics.websocketMessagesTotal.inc({ direction, type: messageType });
  }

  // Get all metrics for Prometheus
  async getMetrics() {
    return promClient.register.metrics();
  }

  // Get health status
  getHealthStatus() {
    return this.healthStatus;
  }
}

module.exports = new MonitoringService();
