const path = require('path');
// Load environment variables FIRST
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { testConnection } = require('./db/connection');
const metricsService = require('./services/monitoring/metrics.service');
const { authenticate, authenticateApiKey, generateToken } = require('./middleware/auth');
const websocketServer = require('./ws/websocket.server');
const eventPoller = require('./services/eventPoller');
const heliusWebhookProcessor = require('./services/heliusWebhook.processor');
const { shutdownManager } = require('./services/resilience.service');
const sniperRoutes = require('./routes/sniperRoutes');
const tradingRoutes = require('./routes/tradingRoutes');
const smartMoneyRoutes = require('./routes/smartMoneyRoutes');
const arbitrageRoutes = require('./routes/arbitrageRoutes');

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
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await metricsService.getMetricsString();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).send('Error generating metrics');
  }
});

// Authentication routes
app.post('/auth/login', async (req, res) => {
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

// Serve export files from the shared exports directory
const exportsDir = path.join(__dirname, '../exports');
app.use('/api/trading/exports', express.static(exportsDir));

// Legacy routes: preserve older frontend/CLI paths
app.get('/sniper/status', (req, res) => res.redirect('/api/sniper/status'));
app.post('/webhook/helius', authenticateApiKey, async (req, res) => {
  try {
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

// Start servers
app.listen(PORT, () => {
  logger.info(`🚀 HTTP API server running on port ${PORT}`);
  logger.info('📋 Available endpoints:');
  logger.info('  /api/sniper/*');
  logger.info('  /api/trading/*');
  logger.info('  /api/smart-money/*');
  logger.info('  /api/arbitrage/*');
});

const websocketPort = parseInt(process.env.WS_PORT, 10) || 3002;
websocketServer.start(websocketPort);
eventPoller.start();

// Register shutdown handlers
shutdownManager.registerHandler(async () => {
  logger.info('Closing WebSocket server...');
  websocketServer.stop();
});

shutdownManager.registerHandler(async () => {
  logger.info('Stopping event poller...');
  eventPoller.stop();
});

shutdownManager.registerHandler(async () => {
  logger.info('Closing database connections...');
  const { pool } = require('./db/connection');
  await pool.end();
});

// Graceful shutdown
process.on('SIGTERM', () => shutdownManager.shutdown('SIGTERM'));
process.on('SIGINT', () => shutdownManager.shutdown('SIGINT'));

