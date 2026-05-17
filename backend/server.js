const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const logger = require('./utils/logger');
const { testConnection } = require('./db/connection');
const DatabaseMigrator = require('./db/migrate');
const monitoringService = require('./services/monitoring/monitoring.service');
const errorHandlingService = require('./services/resilience/error-handling.service');
const failedTradeRecoveryService = require('./services/resilience/failed-trade-recovery.service');
const circuitBreakerService = require('./services/resilience/circuit-breaker.service');
const gracefulShutdownManager = require('./services/resilience/graceful-shutdown.service');
const backupService = require('./services/backup.service');
const diContainer = require('./services/di-container');

const PORT = parseInt(process.env.PORT, 10) || 3001;
const websocketPort = parseInt(process.env.WS_PORT, 10) || 3002;

const requiredEnv = ['JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const katanaEngine = diContainer.get('katanaEngine');
const websocketServer = require('./ws/websocket.server');
const eventPoller = require('./services/eventPoller');
const emailService = require('./services/email.service');
const emailScheduler = require('./services/email-scheduler.service');

async function initializeServices() {
  await monitoringService.initialize();
  logger.info('✓ Monitoring service initialized');

  await errorHandlingService.initialize();
  logger.info('✓ Error handling service initialized');

  await failedTradeRecoveryService.initialize();
  logger.info('✓ Failed trade recovery service initialized');

  circuitBreakerService.initializeBreaker('solana-rpc', { failureThreshold: 5 });
  circuitBreakerService.initializeBreaker('jupiter-api', { failureThreshold: 5 });
  circuitBreakerService.initializeBreaker('helius-api', { failureThreshold: 3 });
  logger.info('✓ Circuit breakers initialized');

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await emailService.initialize().catch((error) => {
      logger.warn('Email service initialization failed, continuing without email functionality:', error.message);
    });

    emailScheduler.start().catch((error) => {
      logger.warn('Failed to start email scheduler, continuing without scheduled emails:', error.message);
    });
  }

  backupService.startScheduledBackups().catch((error) => {
    logger.error('Failed to start backup scheduler:', error);
  });

  // Initialize realtime service (will connect to EventBus and subscribe)
  try {
    const realtimeService = require('./services/realtime.service');
    await realtimeService.initialize();
    logger.info('✓ Realtime service initialized');
  } catch (error) {
    logger.warn('Realtime service initialization failed:', error.message);
  }

  if (process.env.KATANA_ENABLED !== 'false') {
    try {
      await katanaEngine.start();
      logger.info('✓ Katana Mode engine initialized');
    } catch (error) {
      logger.error('Failed to initialize Katana engine:', error);
    }
  }
}

function registerShutdownHandlers(server) {
  gracefulShutdownManager.registerListener('WebSocket server', async () => {
    logger.info('Closing WebSocket server...');
    websocketServer.stop();
  });

  gracefulShutdownManager.registerListener('Realtime service', async () => {
    try {
      const realtimeService = require('./services/realtime.service');
      await realtimeService.shutdown();
      logger.info('Realtime service shutdown complete');
    } catch (e) {
      logger.warn('Realtime service shutdown error:', e.message);
    }
  });

  gracefulShutdownManager.registerListener('Event poller', async () => {
    logger.info('Stopping event poller...');
    eventPoller.stop();
  });

  gracefulShutdownManager.registerListener('Katana Engine', async () => {
    logger.info('Stopping Katana engine...');
    if (katanaEngine && katanaEngine.isActive) {
      await katanaEngine.stop();
    }
  });

  gracefulShutdownManager.registerListener('Database connections', async () => {
    logger.info('Closing database connections...');
    const { pool } = require('./db/connection');
    await pool.end();
  });

  gracefulShutdownManager.registerListener('HTTP server', async () => {
    logger.info('Closing HTTP server...');
    return new Promise((resolve) => server.close(resolve));
  });

  gracefulShutdownManager.initializeSignalHandlers();
}

async function start() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  const migrator = new DatabaseMigrator();
  const migrationSuccess = await migrator.runMigrations();
  if (!migrationSuccess) {
    const allowMigrationFailures = process.env.FORCE_RUN_ON_MIGRATION_ERRORS === 'true' || process.env.NODE_ENV !== 'production';
    if (!allowMigrationFailures) {
      logger.error('Database migrations failed. Exiting...');
      process.exit(1);
    }
    logger.warn('Database migrations failed, but continuing startup because migration failures are allowed in this environment.');
  }

  const server = app.listen(PORT, async () => {
    logger.info(`🚀 HTTP API server running on port ${PORT}`);
    logger.info('📋 Available endpoints:');
    logger.info('  /health          - Health check');
    logger.info('  /api/sniper/*    - Sniper trading');
    logger.info('  /api/trading/*   - Trading routes');
    logger.info('  /api/smart-money/* - Smart money tracking');
    logger.info('  /api/arbitrage/* - Arbitrage detection');
    logger.info('  /metrics         - Prometheus metrics');

    try {
      await initializeServices();
    } catch (error) {
      logger.error('Failed to initialize services:', error);
    }
  });

  websocketServer.start(websocketPort);
  websocketServer.initializeAutoTradeBroadcast();
  eventPoller.start();

  registerShutdownHandlers(server);
  logger.info('System fully initialized and ready to handle requests');
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

start().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});
