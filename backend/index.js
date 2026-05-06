const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const websocketServer = require('./ws/websocket.server');
const eventPoller = require('./services/eventPoller');
const heliusWebhookProcessor = require('./services/heliusWebhook.processor');
const sniperRoutes = require('./routes/sniperRoutes');
const tradingRoutes = require('./routes/tradingRoutes');
const smartMoneyRoutes = require('./routes/smartMoneyRoutes');
const arbitrageRoutes = require('./routes/arbitrageRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes - Modular
app.use(['/api/sniper', '/sniper'], sniperRoutes);
app.use(['/api/smart-money', '/smart-money'], smartMoneyRoutes);
app.use(['/api/arbitrage', '/arbitrage'], arbitrageRoutes);

// Legacy routes: preserve older frontend/CLI paths
app.get('/sniper/status', (req, res) => res.redirect('/api/sniper/status'));
app.post('/webhook/helius', async (req, res) => {
  try {
    const result = await heliusWebhookProcessor.processWebhook(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
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

app.post('/token/detect', async (req, res) => {
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

