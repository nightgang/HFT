const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const logger = require('./utils/logger');
const { AppError } = require('./utils/errors');
const auditUtil = require('./utils/audit');
const { authenticate, authenticateApiKey, generateToken, verifyWebhookSignature } = require('./middleware/auth');
const {
  requestIdMiddleware,
  requestLoggingMiddleware,
  errorHandlingMiddleware,
  healthCheckHandler,
  readinessProbeHandler,
  livenessProbeHandler,
} = require('./middleware/monitoring.middleware');
const websocketServer = require('./ws/websocket.server');
const heliusWebhookProcessor = require('./services/heliusWebhook.processor');
const registerRoutes = require('./routes');
const predictionEngine = require('./services/engines/prediction.engine');
const sniperEngine = require('./services/engines/sniper.engine');
const monitoringService = require('./services/monitoring/monitoring.service');

const app = express();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Solana HFT Trading API',
    version: '1.0.0',
    description: 'Institutional-grade Solana trading system API',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3001}`,
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

const swaggerOptions = {
  swaggerDefinition,
  apis: ['./routes/*.js', './app.js'],
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    try {
      monitoringService.recordRateLimitHit(req.path);
    } catch (error) {
      logger.debug('Failed to record rate limit hit:', error.message);
    }

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many sensitive requests, please try again later.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    try {
      monitoringService.recordRateLimitHit(req.path);
    } catch (error) {
      logger.debug('Failed to record rate limit hit:', error.message);
    }

    res.status(429).json({
      error: 'Too many sensitive requests, please try again later.',
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
    });
  }
});

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
  optionsSuccessStatus: 200,
};

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(requestIdMiddleware);
app.use(requestLoggingMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  },
});

app.use((req, res, next) => {
  // Apply CSRF protection for the token endpoint only, but skip it for normal GETs that don't need a token.
  if (req.path === '/csrf-token') {
    return csrfProtection(req, res, next);
  }

  const usesApiAuth = !!req.headers.authorization || !!req.headers['x-api-key'];
  const isApiRoute = req.path.startsWith('/api/');

  // Skip CSRF for safe requests, webhooks, health checks, API routes, and token-authenticated requests.
  const skipCsrf = [
    req.method === 'GET',
    req.method === 'HEAD',
    req.method === 'OPTIONS',
    req.path === '/webhook/helius',
    req.path === '/health',
    req.path === '/healthz/live',
    req.path === '/healthz/ready',
    req.path === '/metrics',
    req.path.startsWith('/auth/login'),
    req.path.startsWith('/auth/register'),
    req.path.startsWith('/api-docs'),
    req.path === '/swagger.json',
    isApiRoute,
    usesApiAuth,
  ];

  if (skipCsrf.some(skip => skip)) {
    return next();
  }

  return csrfProtection(req, res, next);
});

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get('/health', healthCheckHandler);
app.get('/healthz/live', livenessProbeHandler);
app.get('/healthz/ready', readinessProbeHandler);

app.get('/metrics', async (req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).send('Error generating metrics');
  }
});

app.post('/auth/login', strictLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      await auditUtil.logLoginAttempt(username || 'unknown', false, req.ip, req.get('User-Agent'));
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Require environment variables - no defaults
    const validUsername = process.env.ADMIN_USERNAME;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validUsername || !validPassword) {
      logger.error('Admin credentials not configured in environment');
      return res.status(500).json({
        success: false,
        error: 'Authentication service not properly configured',
        code: 'AUTH_CONFIG_ERROR'
      });
    }

    // Use constant-time comparison to prevent timing attacks
    const usernameMatch = crypto.timingSafeEqual(
      Buffer.from(username),
      Buffer.from(validUsername)
    ).valueOf();
    const passwordMatch = crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(validPassword)
    ).valueOf();

    const success = usernameMatch && passwordMatch;

    await auditUtil.logLoginAttempt(username, success, req.ip, req.get('User-Agent'));

    if (success) {
      const token = generateToken({ username });
      res.json({ success: true, token, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials', code: 'AUTH_INVALID' });
    }
  } catch (error) {
    logger.error('Login error:', error);
    await auditUtil.logLoginAttempt(req.body?.username || 'unknown', false, req.ip, req.get('User-Agent'));
    res.status(500).json({ success: false, error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

app.post('/auth/verify', authenticate, (req, res) => {
  res.json({ success: true, user: req.user, message: 'Token is valid' });
});

registerRoutes(app);

const exportsDir = path.join(__dirname, '../exports');
app.use('/api/trading/exports', express.static(exportsDir));

app.post('/webhook/helius', strictLimiter, authenticateApiKey, async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(401).json({ success: false, error: 'Invalid webhook signature' });
    }

    const result = await heliusWebhookProcessor.processWebhook(req.body);
    await auditUtil.logWebhookReceived('helius', JSON.stringify(req.body).length, true, req.ip);
    res.json({ success: true, ...result });
  } catch (error) {
    await auditUtil.logWebhookReceived('helius', JSON.stringify(req.body).length, false, req.ip);
    logger.error('Helius webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/prediction/:tokenMint', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const prediction = await predictionEngine.scoreTrade(tokenMint, {});
    res.json(prediction);
  } catch (error) {
    logger.error('Prediction route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/token/detect', authenticate, async (req, res) => {
  try {
    await sniperEngine.processTokenDetection(req.body);
    res.json({ success: true, message: 'Token detection processed' });
  } catch (error) {
    logger.error('Token detection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/ws/info', (req, res) => {
  res.json({ port: websocketServer.port, clients: websocketServer.getClientCount() });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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
  next(err);
});

app.use(errorHandlingMiddleware);

module.exports = app;
