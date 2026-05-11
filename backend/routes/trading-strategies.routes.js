const express = require('express');
const { authenticate } = require('../middleware/auth');
const diContainer = require('../services/di-container');
const logger = require('../utils/logger');

const router = express.Router();

// Grid Trading Routes
router.post('/grid-trading', authenticate, async (req, res) => {
  try {
    const gridTradingService = diContainer.get('gridTradingService');
    const { configData } = req.body;
    const result = await gridTradingService.createGridTrading(req.user.wallet_id, configData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating grid trading:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/grid-trading/:gridId/stats', authenticate, async (req, res) => {
  try {
    const gridTradingService = diContainer.get('gridTradingService');
    const stats = await gridTradingService.getGridStats(req.params.gridId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching grid stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/grid-trading/:gridId/orders/:orderId/fill', authenticate, async (req, res) => {
  try {
    const gridTradingService = diContainer.get('gridTradingService');
    const { filledQuantity, avgPrice } = req.body;
    const result = await gridTradingService.updateGridOrder(req.params.orderId, filledQuantity, avgPrice);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error updating grid order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/grid-trading/:gridId/close', authenticate, async (req, res) => {
  try {
    const gridTradingService = diContainer.get('gridTradingService');
    const result = await gridTradingService.closeGridTrading(req.params.gridId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error closing grid trading:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DCA Routes
router.post('/dca', authenticate, async (req, res) => {
  try {
    const dcaService = diContainer.get('dcaService');
    const { configData } = req.body;
    const result = await dcaService.createDCA(req.user.wallet_id, configData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating DCA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dca/:dcaId/status', authenticate, async (req, res) => {
  try {
    const dcaService = diContainer.get('dcaService');
    const status = await dcaService.getDCAStatus(req.params.dcaId);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Error fetching DCA status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/dca/:dcaId/execute', authenticate, async (req, res) => {
  try {
    const dcaService = diContainer.get('dcaService');
    const { executionData } = req.body;
    const result = await dcaService.executeDCAOrder(req.params.dcaId, executionData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing DCA order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scalping Bot Routes
router.post('/scalping-bot', authenticate, async (req, res) => {
  try {
    const scalpingBotService = diContainer.get('scalpingBotService');
    const { botData } = req.body;
    const result = await scalpingBotService.createScalpingBot(req.user.wallet_id, botData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating scalping bot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scalping-bot/:botId/enter', authenticate, async (req, res) => {
  try {
    const scalpingBotService = diContainer.get('scalpingBotService');
    const { tradeData } = req.body;
    const result = await scalpingBotService.enterScalpingTrade(req.params.botId, tradeData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error entering scalping trade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scalping-bot/:botId/trades/:tradeId/exit', authenticate, async (req, res) => {
  try {
    const scalpingBotService = diContainer.get('scalpingBotService');
    const { exitData } = req.body;
    const result = await scalpingBotService.exitScalpingTrade(req.params.tradeId, exitData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error exiting scalping trade:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/scalping-bot/:botId/stats', authenticate, async (req, res) => {
  try {
    const scalpingBotService = diContainer.get('scalpingBotService');
    const stats = await scalpingBotService.getBotStats(req.params.botId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching scalping bot stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Arbitrage Routes
router.get('/arbitrage/opportunities', authenticate, async (req, res) => {
  try {
    const arbitrageService = diContainer.get('arbitrageService');
    const opportunities = await arbitrageService.getActiveOpportunities(req.user.wallet_id);
    res.json({ success: true, data: opportunities });
  } catch (error) {
    logger.error('Error fetching arbitrage opportunities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/arbitrage/detect', authenticate, async (req, res) => {
  try {
    const arbitrageService = diContainer.get('arbitrageService');
    const { tokenMints } = req.body;
    const opportunities = await arbitrageService.detectOpportunities(req.user.wallet_id, tokenMints);
    res.json({ success: true, data: opportunities });
  } catch (error) {
    logger.error('Error detecting arbitrage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/arbitrage/:opportunityId/execute', authenticate, async (req, res) => {
  try {
    const arbitrageService = diContainer.get('arbitrageService');
    const { executionData } = req.body;
    const result = await arbitrageService.executeArbitrage(req.params.opportunityId, executionData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing arbitrage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Portfolio Rebalancing Routes
router.get('/rebalancing/history', authenticate, async (req, res) => {
  try {
    const rebalancingService = diContainer.get('rebalancingService');
    const history = await rebalancingService.getRebalancingHistory(req.user.wallet_id);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error fetching rebalancing history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rebalancing/check', authenticate, async (req, res) => {
  try {
    const rebalancingService = diContainer.get('rebalancingService');
    const { currentAllocations, targetAllocations } = req.body;
    const needed = await rebalancingService.checkRebalancingNeeded(req.user.wallet_id, currentAllocations, targetAllocations);
    res.json({ success: true, needed });
  } catch (error) {
    logger.error('Error checking rebalancing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rebalancing/execute', authenticate, async (req, res) => {
  try {
    const rebalancingService = diContainer.get('rebalancingService');
    const { rebalancingData } = req.body;
    const result = await rebalancingService.rebalancePortfolio(req.user.wallet_id, rebalancingData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error executing rebalancing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop Loss / Take Profit Routes
router.post('/sltp', authenticate, async (req, res) => {
  try {
    const slTPService = diContainer.get('slTPService');
    const { slTPData } = req.body;
    const result = await slTPService.createSLTPOrders(req.user.wallet_id, slTPData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating SL/TP order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sltp/active', authenticate, async (req, res) => {
  try {
    const slTPService = diContainer.get('slTPService');
    const orders = await slTPService.getActiveOrders(req.user.wallet_id);
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Error fetching active SL/TP orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Position Cloning Routes
router.post('/position-cloning', authenticate, async (req, res) => {
  try {
    const positionCloningService = diContainer.get('positionCloningService');
    const { configData } = req.body;
    const result = await positionCloningService.createCloneConfig(req.user.wallet_id, configData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating position clone config:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/position-cloning/:cloneId/stats', authenticate, async (req, res) => {
  try {
    const positionCloningService = diContainer.get('positionCloningService');
    const stats = await positionCloningService.getCloneStats(req.params.cloneId);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching clone stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/position-cloning/:cloneId/history', authenticate, async (req, res) => {
  try {
    const positionCloningService = diContainer.get('positionCloningService');
    const history = await positionCloningService.getExecutionHistory(req.params.cloneId);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error fetching clone execution history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Options/Futures Routes
router.post('/options-futures/position', authenticate, async (req, res) => {
  try {
    const optionsFuturesService = diContainer.get('optionsFuturesService');
    const { positionData } = req.body;
    const result = await optionsFuturesService.createPosition(req.user.wallet_id, positionData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating options/futures position:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/options-futures/order', authenticate, async (req, res) => {
  try {
    const optionsFuturesService = diContainer.get('optionsFuturesService');
    const { orderData } = req.body;
    const result = await optionsFuturesService.createOrder(req.user.wallet_id, orderData);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error creating options/futures order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/options-futures/positions', authenticate, async (req, res) => {
  try {
    const optionsFuturesService = diContainer.get('optionsFuturesService');
    const positions = await optionsFuturesService.getActivePositions(req.user.wallet_id);
    res.json({ success: true, data: positions });
  } catch (error) {
    logger.error('Error fetching options/futures positions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/options-futures/:positionId/close', authenticate, async (req, res) => {
  try {
    const optionsFuturesService = diContainer.get('optionsFuturesService');
    const result = await optionsFuturesService.closePosition(req.params.positionId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error closing options/futures position:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
