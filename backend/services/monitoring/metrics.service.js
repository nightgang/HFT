const promClient = require('prom-client');
const logger = require('../../utils/logger');

// Use the global Prometheus registry so all metrics are exposed together
const register = promClient.register;

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'hft-trading-backend'
});

// Custom metrics
const metrics = {
  // Trade metrics
  tradesTotal: new promClient.Counter({
    name: 'hft_trades_total',
    help: 'Total number of trades executed',
    labelNames: ['strategy', 'status', 'wallet'],
    registers: [register]
  }),

  tradeDuration: new promClient.Histogram({
    name: 'hft_trade_duration_seconds',
    help: 'Duration of trade execution',
    labelNames: ['strategy'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    registers: [register]
  }),

  tradePnL: new promClient.Gauge({
    name: 'hft_trade_pnl_usd',
    help: 'Profit and loss per trade in USD',
    labelNames: ['strategy', 'wallet'],
    registers: [register]
  }),

  // Risk metrics
  riskViolationsTotal: new promClient.Counter({
    name: 'hft_risk_violations_total',
    help: 'Total number of risk violations',
    labelNames: ['violation_type', 'severity'],
    registers: [register]
  }),

  walletBalance: new promClient.Gauge({
    name: 'hft_wallet_balance',
    help: 'Current wallet balance',
    labelNames: ['wallet', 'token'],
    registers: [register]
  }),

  // Performance metrics
  rpcLatency: new promClient.Histogram({
    name: 'hft_rpc_request_duration_seconds',
    help: 'RPC request latency',
    labelNames: ['endpoint', 'method'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register]
  }),

  jupiterApiLatency: new promClient.Histogram({
    name: 'hft_jupiter_api_duration_seconds',
    help: 'Jupiter API request latency',
    labelNames: ['endpoint'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register]
  }),

  // System metrics
  activeConnections: new promClient.Gauge({
    name: 'hft_websocket_connections_active',
    help: 'Number of active WebSocket connections',
    registers: [register]
  }),

  databaseConnections: new promClient.Gauge({
    name: 'hft_database_connections_active',
    help: 'Number of active database connections',
    registers: [register]
  }),

  // Error metrics
  errorsTotal: new promClient.Counter({
    name: 'hft_errors_total',
    help: 'Total number of errors',
    labelNames: ['type', 'component'],
    registers: [register]
  }),

  // Health check metrics
  healthCheckStatus: new promClient.Gauge({
    name: 'hft_health_check_status',
    help: 'Health check status (1=healthy, 0=unhealthy)',
    labelNames: ['check_type'],
    registers: [register]
  })
};

class MetricsService {
  // Get metrics registry
  getRegistry() {
    return register;
  }

  // Record trade metrics
  recordTrade(strategy, status, wallet, duration = null, pnl = null) {
    try {
      metrics.tradesTotal.inc({ strategy, status, wallet });

      if (duration !== null) {
        metrics.tradeDuration.observe({ strategy }, duration);
      }

      if (pnl !== null) {
        metrics.tradePnL.set({ strategy, wallet }, pnl);
      }
    } catch (error) {
      logger.error('Error recording trade metrics:', error);
    }
  }

  // Record risk violation
  recordRiskViolation(violationType, severity) {
    try {
      metrics.riskViolationsTotal.inc({ violation_type: violationType, severity });
    } catch (error) {
      logger.error('Error recording risk violation metrics:', error);
    }
  }

  // Update wallet balance
  updateWalletBalance(wallet, token, balance) {
    try {
      metrics.walletBalance.set({ wallet, token }, balance);
    } catch (error) {
      logger.error('Error updating wallet balance metrics:', error);
    }
  }

  // Record RPC latency
  recordRpcLatency(endpoint, method, duration) {
    try {
      metrics.rpcLatency.observe({ endpoint, method }, duration);
    } catch (error) {
      logger.error('Error recording RPC latency metrics:', error);
    }
  }

  // Record Jupiter API latency
  recordJupiterApiLatency(endpoint, duration) {
    try {
      metrics.jupiterApiLatency.observe({ endpoint }, duration);
    } catch (error) {
      logger.error('Error recording Jupiter API latency metrics:', error);
    }
  }

  // Update active connections
  updateActiveConnections(count) {
    try {
      metrics.activeConnections.set(count);
    } catch (error) {
      logger.error('Error updating active connections metrics:', error);
    }
  }

  // Update database connections
  updateDatabaseConnections(count) {
    try {
      metrics.databaseConnections.set(count);
    } catch (error) {
      logger.error('Error updating database connections metrics:', error);
    }
  }

  // Record error
  recordError(type, component) {
    try {
      metrics.errorsTotal.inc({ type, component });
    } catch (error) {
      logger.error('Error recording error metrics:', error);
    }
  }

  // Update health check status
  updateHealthCheckStatus(checkType, status) {
    try {
      metrics.healthCheckStatus.set({ check_type: checkType }, status ? 1 : 0);
    } catch (error) {
      logger.error('Error updating health check metrics:', error);
    }
  }

  // Get metrics as string (for /metrics endpoint)
  async getMetricsString() {
    try {
      return await register.metrics();
    } catch (error) {
      logger.error('Error getting metrics string:', error);
      return '';
    }
  }

  // Reset all metrics (for testing)
  reset() {
    try {
      register.resetMetrics();
    } catch (error) {
      logger.error('Error resetting metrics:', error);
    }
  }
}

module.exports = new MetricsService();