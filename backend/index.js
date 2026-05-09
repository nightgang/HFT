const path = require('path');
// Load environment variables FIRST
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const logger = require('./utils/logger');
const { testConnection } = require('./db/connection');
const metricsService = require('./services/monitoring/metrics.service');
const monitoringService = require('./services/monitoring/monitoring.service');
const circuitBreakerService = require('./services/resilience/circuit-breaker.service');
const errorHandlingService = require('./services/resilience/error-handling.service');
const gracefulShutdownManager = require('./services/resilience/graceful-shutdown.service');
const failedTradeRecoveryService = require('./services/resilience/failed-trade-recovery.service');
const { authenticate, authenticateApiKey, generateToken, verifyWebhookSignature } = require('./middleware/auth');
const {
  requestIdMiddleware,
  requestLoggingMiddleware,
  errorHandlingMiddleware,
  healthCheckHandler,
  readinessProbeHandler,
  livenessProbeHandler
} = require('./middleware/monitoring.middleware');
const websocketServer = require('./ws/websocket.server');
const eventPoller = require('./services/eventPoller');
const heliusWebhookProcessor = require('./services/heliusWebhook.processor');
const sniperRoutes = require('./routes/sniperRoutes');
const tradingRoutes = require('./routes/tradingRoutes');
const smartMoneyRoutes = require('./routes/smartMoneyRoutes');
const arbitrageRoutes = require('./routes/arbitrageRoutes');
const katanaRoutes = require('./routes/katanaRoutes');
const backupService = require('./services/backup.service');
const executionAnalyticsService = require('./services/execution-analytics.service');
const emailScheduler = require('./services/email-scheduler.service');
const diContainer = require('./services/di-container');

diContainer.register('executionAnalyticsService', executionAnalyticsService);
diContainer.register('emailScheduler', emailScheduler);
diContainer.register('monitoringService', monitoringService);
diContainer.register('circuitBreakerService', circuitBreakerService);
diContainer.register('failedTradeRecoveryService', failedTradeRecoveryService);

// Initialize Katana Engine
const katanaEngine = require('./services/engines/katana.engine');
diContainer.register('katanaEngine', katanaEngine);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // stricter limit for sensitive operations
  message: {
    error: 'Too many sensitive requests, please try again later.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED'
  },
});

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.set('trust proxy', 1); // Trust first proxy for rate limiting
app.use(cors(corsOptions));
app.use(cookieParser());

// Add request ID and logging middleware early
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
});

app.use((req, res, next) => {
  if (req.path === '/webhook/helius' || req.path === '/metrics' || req.path.startsWith('/api-docs') || req.path === '/swagger.json') {
    return next();
  }
  return csrfProtection(req, res, next);
});

app.use(limiter);

// Swagger API Documentation
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Solana HFT Trading API',
    version: '1.0.0',
    description: 'Institutional-grade Solana trading system API',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    },
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
    {
      apiKeyAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './index.js'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJSDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API documentation endpoint
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Health check endpoint (comprehensive)
app.get('/health', healthCheckHandler);

// Kubernetes liveness probe
app.get('/healthz/live', livenessProbeHandler);

// Kubernetes readiness probe  
app.get('/healthz/ready', readinessProbeHandler);

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).send('Error generating metrics');
  }
});

// Circuit breaker status
app.get('/api/system/circuit-breakers', authenticate, (req, res) => {
  try {
    const status = circuitBreakerService.getAllStatus();
    res.json({
      success: true,
      circuit_breakers: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Circuit breaker status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recovery queue status
app.get('/api/system/recovery-queue', authenticate, async (req, res) => {
  try {
    const stats = await failedTradeRecoveryService.getQueueStats();
    res.json({
      success: true,
      recovery_queue: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Recovery queue status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error stats
app.get('/api/system/errors', authenticate, async (req, res) => {
  try {
    const stats = await errorHandlingService.getErrorStats();
    res.json({
      success: true,
      error_stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// System status summary
app.get('/api/system/status', authenticate, async (req, res) => {
  try {
    const [circuitStatus, recoveryStats, errorStats] = await Promise.all([
      circuitBreakerService.getAllStatus(),
      failedTradeRecoveryService.getQueueStats(),
      errorHandlingService.getErrorStats()
    ]);

    res.json({
      success: true,
      system: {
        uptime_seconds: process.uptime(),
        circuit_breakers: circuitStatus,
        recovery_queue: recoveryStats,
        error_stats: errorStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('System status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// Authentication routes
app.post('/auth/login', strictLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Simple authentication - in production, use proper user management
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const success = username === validUsername && password === validPassword;

    // Audit login attempt
    await require('./utils/audit').logLoginAttempt(username, success, req.ip, req.get('User-Agent'));

    if (success) {
      const token = generateToken({ username });
      res.json({
        success: true,
        token,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/auth/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Token is valid'
  });
});

// API Routes - Modular
app.use(['/api/trading', '/trading'], tradingRoutes);
app.use(['/api/sniper', '/sniper'], sniperRoutes);
app.use(['/api/smart-money', '/smart-money'], smartMoneyRoutes);
app.use(['/api/arbitrage', '/arbitrage'], arbitrageRoutes);
app.use(['/api/katana', '/katana'], katanaRoutes);

// Serve export files from the shared exports directory
const exportsDir = path.join(__dirname, '../exports');
app.use('/api/trading/exports', express.static(exportsDir));

// Legacy routes: preserve older frontend/CLI paths
app.get('/sniper/status', (req, res) => res.redirect('/api/sniper/status'));
app.post('/webhook/helius', strictLimiter, authenticateApiKey, async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    }

    const result = await heliusWebhookProcessor.processWebhook(req.body);

    // Audit webhook reception
    await require('./utils/audit').logWebhookReceived('helius', JSON.stringify(req.body).length, true, req.ip);

    res.json({ success: true, ...result });
  } catch (error) {
    // Audit failed webhook processing
    await require('./utils/audit').logWebhookReceived('helius', JSON.stringify(req.body).length, false, req.ip);

    logger.error('Helius webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/prediction/:tokenMint', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const prediction = await require('./services/engines/prediction.engine').scoreTrade(tokenMint, {});
    res.json(prediction);
  } catch (error) {
    logger.error('Prediction route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/token/detect', authenticate, async (req, res) => {
  try {
    await require('./services/engines/sniper.engine').processTokenDetection(req.body);
    res.json({ success: true, message: 'Token detection processed' });
  } catch (error) {
    logger.error('Token detection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket info
app.get('/ws/info', (req, res) => {
  res.json({
    port: websocketServer.port,
    clients: websocketServer.getClientCount(),
  });
});

app.use(['/api/trading', '/trade', '/'], tradingRoutes);

// Error handling
app.use((err, req, res, next) => {
  if (err && err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token mismatch:', err);
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }

  if (err instanceof AppError) {
    logger.warn(`Handled app error: ${err.code}`);
    return res.status(err.statusCode).json({ error: err.message, code: err.code, details: err.details });
  }

  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize email service if SMTP is configured
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  const emailService = require('./services/email.service');
  emailService.initialize().catch(error => {
    logger.error('Failed to initialize email service:', error);
  });

  // Start email scheduler
  const emailScheduler = require('./services/email-scheduler.service');
  emailScheduler.start().catch(error => {
    logger.error('Failed to start email scheduler:', error);
  });
}

// Global error handlers for debugging runtime crashes
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
  process.exit(1);
});

// Validate required environment variables
const requiredEnv = ['RPC_URL', 'JUPITER_API_URL', 'HELIUS_API_KEY'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// Test database connection
(async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Run database migrations
  const DatabaseMigrator = require('./db/migrate');
  const migrator = new DatabaseMigrator();
  const migrationSuccess = await migrator.runMigrations();
  if (!migrationSuccess) {
    logger.error('Database migrations failed. Exiting...');
    process.exit(1);
  }
})();

// Error handling middleware (must be last before listen)
app.use(errorHandlingMiddleware);

// Start servers
const server = app.listen(PORT, async () => {
  logger.info(`🚀 HTTP API server running on port ${PORT}`);
  logger.info('📋 Available endpoints:');
  logger.info('  /health          - Health check');
  logger.info('  /api/sniper/*    - Sniper trading');
  logger.info('  /api/trading/*   - Trading routes');
  logger.info('  /api/smart-money/* - Smart money tracking');
  logger.info('  /api/arbitrage/* - Arbitrage detection');
  logger.info('  /metrics         - Prometheus metrics');

  // Initialize services
  try {
    await monitoringService.initialize();
    logger.info('✓ Monitoring service initialized');

    await errorHandlingService.initialize();
    logger.info('✓ Error handling service initialized');

    await failedTradeRecoveryService.initialize();
    logger.info('✓ Failed trade recovery service initialized');

    // Initialize circuit breakers for external services
    circuitBreakerService.initializeBreaker('solana-rpc', { failureThreshold: 5 });
    circuitBreakerService.initializeBreaker('jupiter-api', { failureThreshold: 5 });
    circuitBreakerService.initializeBreaker('helius-api', { failureThreshold: 3 });
    logger.info('✓ Circuit breakers initialized');

    backupService.startScheduledBackups().catch(error => {
      logger.error('Failed to start backup scheduler:', error);
    });

    // Initialize Katana Engine if enabled
    if (process.env.KATANA_ENABLED !== 'false') {
      try {
        await katanaEngine.start();
        logger.info('✓ Katana Mode engine initialized');
      } catch (error) {
        logger.error('Failed to initialize Katana engine:', error);
      }
    }

  } catch (error) {
    logger.error('Failed to initialize services:', error);
  }
});

const websocketPort = parseInt(process.env.WS_PORT, 10) || 3002;
websocketServer.start(websocketPort);
eventPoller.start();

// Register graceful shutdown handlers
gracefulShutdownManager.registerListener('WebSocket server', async () => {
  logger.info('Closing WebSocket server...');
  websocketServer.stop();
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
  return new Promise((resolve) => {
    server.close(resolve);
  });
});

// Initialize signal handlers
gracefulShutdownManager.initializeSignalHandlers();

logger.info('System fully initialized and ready to handle requests');


