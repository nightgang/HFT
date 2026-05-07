const path = require('path');
// Load environment variables FIRST
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { authenticate, authenticateApiKey, generateToken } = require('./middleware/auth');
const websocketServer = require('./ws/websocket.server');
const eventPoller = require('./services/eventPoller');
const heliusWebhookProcessor = require('./services/heliusWebhook.processor');
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
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

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  websocketServer.stop();
  eventPoller.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  websocketServer.stop();
  eventPoller.stop();
  process.exit(0);
});

