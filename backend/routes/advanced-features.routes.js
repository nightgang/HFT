const express = require('express');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const diContainer = require('../services/di-container');

const router = express.Router();

// ============================================================================
// ADVANCED ORDERS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/advanced-orders:
 *   post:
 *     summary: Create an advanced order (stop-loss, take-profit, conditional)
 *     tags: [Advanced Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_type:
 *                 type: string
 *                 enum: [market, limit, stop_loss, take_profit, conditional]
 *               input_token_mint:
 *                 type: string
 *               input_token_symbol:
 *                 type: string
 *               input_amount:
 *                 type: number
 *               output_token_mint:
 *                 type: string
 *               output_token_symbol:
 *                 type: string
 *               trigger_price:
 *                 type: number
 *               limit_price:
 *                 type: number
 *               stop_loss_price:
 *                 type: number
 *               take_profit_price:
 *                 type: number
 *               condition_type:
 *                 type: string
 *                 enum: [price_above, price_below, price_between, volatility_above, time_based]
 *               condition_value:
 *                 type: number
 *               execute_at:
 *                 type: string
 *                 format: date-time
 *               expires_at:
 *                 type: string
 *                 format: date-time
 */
router.post('/advanced-orders', authenticate, async (req, res) => {
  try {
    const advancedOrdersService = diContainer.get('advancedOrdersService');
    const order = await advancedOrdersService.createAdvancedOrder(req.user.wallet_id, req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error creating advanced order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/advanced-orders:
 *   get:
 *     summary: Get active advanced orders for wallet
 *     tags: [Advanced Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/advanced-orders', authenticate, async (req, res) => {
  try {
    const advancedOrdersService = diContainer.get('advancedOrdersService');
    const orders = await advancedOrdersService.getActiveOrders(req.user.wallet_id);
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Error fetching advanced orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/advanced-orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel an advanced order
 *     tags: [Advanced Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post('/advanced-orders/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const advancedOrdersService = diContainer.get('advancedOrdersService');
    const order = await advancedOrdersService.cancelOrder(req.params.orderId, req.user.wallet_id);
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error cancelling advanced order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// LIQUIDITY POOL ROUTES
// ============================================================================

/**
 * @swagger
 * /api/liquidity/pools/{poolId}/add:
 *   post:
 *     summary: Add liquidity to a pool
 *     tags: [Liquidity Pools]
 *     security:
 *       - bearerAuth: []
 */
router.post('/liquidity/pools/:poolId/add', authenticate, async (req, res) => {
  try {
    const liquidityPoolService = diContainer.get('liquidityPoolService');
    const position = await liquidityPoolService.addLiquidity(req.user.wallet_id, req.params.poolId, req.body);
    res.json({ success: true, data: position });
  } catch (error) {
    logger.error('Error adding liquidity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/liquidity/positions:
 *   get:
 *     summary: Get wallet liquidity positions
 *     tags: [Liquidity Pools]
 *     security:
 *       - bearerAuth: []
 */
router.get('/liquidity/positions', authenticate, async (req, res) => {
  try {
    const liquidityPoolService = diContainer.get('liquidityPoolService');
    const positions = await liquidityPoolService.getWalletPositions(req.user.wallet_id);
    res.json({ success: true, data: positions });
  } catch (error) {
    logger.error('Error fetching liquidity positions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/liquidity/positions/{positionId}/remove:
 *   post:
 *     summary: Remove liquidity from position
 *     tags: [Liquidity Pools]
 *     security:
 *       - bearerAuth: []
 */
router.post('/liquidity/positions/:positionId/remove', authenticate, async (req, res) => {
  try {
    const liquidityPoolService = diContainer.get('liquidityPoolService');
    const position = await liquidityPoolService.removeLiquidity(req.user.wallet_id, req.params.positionId);
    res.json({ success: true, data: position });
  } catch (error) {
    logger.error('Error removing liquidity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/liquidity/positions/{positionId}/claim:
 *   post:
 *     summary: Claim fees from liquidity position
 *     tags: [Liquidity Pools]
 *     security:
 *       - bearerAuth: []
 */
router.post('/liquidity/positions/:positionId/claim', authenticate, async (req, res) => {
  try {
    const liquidityPoolService = diContainer.get('liquidityPoolService');
    const position = await liquidityPoolService.claimFees(req.user.wallet_id, req.params.positionId);
    res.json({ success: true, data: position });
  } catch (error) {
    logger.error('Error claiming fees:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// LIMIT ORDER BOOK ROUTES
// ============================================================================

/**
 * @swagger
 * /api/limit-orders:
 *   post:
 *     summary: Create a limit order
 *     tags: [Limit Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post('/limit-orders', authenticate, async (req, res) => {
  try {
    const limitOrderBookService = diContainer.get('limitOrderBookService');
    const order = await limitOrderBookService.createLimitOrder(req.user.wallet_id, req.body);
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error creating limit order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/limit-orders:
 *   get:
 *     summary: Get open limit orders for wallet
 *     tags: [Limit Orders]
 *     security:
 *       - bearerAuth: []
 */
router.get('/limit-orders', authenticate, async (req, res) => {
  try {
    const limitOrderBookService = diContainer.get('limitOrderBookService');
    const orders = await limitOrderBookService.getOpenOrders(req.user.wallet_id);
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Error fetching limit orders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/limit-orders/book/{inputMint}/{outputMint}:
 *   get:
 *     summary: Get order book for token pair
 *     tags: [Limit Orders]
 *     parameters:
 *       - name: inputMint
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: outputMint
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: depth
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 */
router.get('/limit-orders/book/:inputMint/:outputMint', async (req, res) => {
  try {
    const limitOrderBookService = diContainer.get('limitOrderBookService');
    const depth = parseInt(req.query.depth) || 20;
    const orderBook = await limitOrderBookService.getOrderBook(
      req.params.inputMint,
      req.params.outputMint,
      depth
    );
    res.json({ success: true, data: orderBook });
  } catch (error) {
    logger.error('Error fetching order book:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/limit-orders/{orderId}/cancel:
 *   post:
 *     summary: Cancel a limit order
 *     tags: [Limit Orders]
 *     security:
 *       - bearerAuth: []
 */
router.post('/limit-orders/:orderId/cancel', authenticate, async (req, res) => {
  try {
    const limitOrderBookService = diContainer.get('limitOrderBookService');
    const order = await limitOrderBookService.cancelOrder(req.params.orderId, req.user.wallet_id);
    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error cancelling limit order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// P&L DASHBOARD ROUTES
// ============================================================================

/**
 * @swagger
 * /api/analytics/pnl/dashboard:
 *   get:
 *     summary: Get P&L dashboard data
 *     tags: [Analytics, P&L]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/pnl/dashboard', authenticate, async (req, res) => {
  try {
    const pnlDashboardService = diContainer.get('pnlDashboardService');
    const dashboard = await pnlDashboardService.getDashboard(req.user.wallet_id);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    logger.error('Error fetching P&L dashboard:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/pnl/history:
 *   get:
 *     summary: Get P&L history
 *     tags: [Analytics, P&L]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: start_date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: end_date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/analytics/pnl/history', authenticate, async (req, res) => {
  try {
    const pnlDashboardService = diContainer.get('pnlDashboardService');
    const history = await pnlDashboardService.getPnLHistory(
      req.user.wallet_id,
      req.query.start_date,
      req.query.end_date
    );
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error fetching P&L history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/attribution/strategy:
 *   get:
 *     summary: Get strategy performance attribution
 *     tags: [Analytics, Attribution]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/attribution/strategy', authenticate, async (req, res) => {
  try {
    const performanceAttributionService = diContainer.get('performanceAttributionService');
    const attribution = await performanceAttributionService.getStrategyAttribution(
      req.user.wallet_id,
      req.query.start_date,
      req.query.end_date
    );
    res.json({ success: true, data: attribution });
  } catch (error) {
    logger.error('Error fetching strategy attribution:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/analytics/attribution/token:
 *   get:
 *     summary: Get token performance attribution
 *     tags: [Analytics, Attribution]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics/attribution/token', authenticate, async (req, res) => {
  try {
    const tokenAttributionService = diContainer.get('tokenAttributionService');
    const attribution = await tokenAttributionService.getTokenAttribution(
      req.user.wallet_id,
      req.query.start_date,
      req.query.end_date
    );
    res.json({ success: true, data: attribution });
  } catch (error) {
    logger.error('Error fetching token attribution:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// RISK HEATMAP ROUTES
// ============================================================================

/**
 * @swagger
 * /api/risk/heatmap:
 *   get:
 *     summary: Get position concentration heatmap
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 */
router.get('/risk/heatmap', authenticate, async (req, res) => {
  try {
    const riskHeatmapService = diContainer.get('riskHeatmapService');
    const heatmap = await riskHeatmapService.getConcentrationHeatmap(req.user.wallet_id);
    res.json({ success: true, data: heatmap });
  } catch (error) {
    logger.error('Error fetching risk heatmap:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/risk/correlation:
 *   get:
 *     summary: Get portfolio correlation matrix
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 */
router.get('/risk/correlation', authenticate, async (req, res) => {
  try {
    const correlationAnalysisService = diContainer.get('correlationAnalysisService');
    const matrix = await correlationAnalysisService.getCorrelationMatrix(req.user.wallet_id);
    res.json({ success: true, data: matrix });
  } catch (error) {
    logger.error('Error fetching correlation matrix:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/risk/diversification-issues:
 *   get:
 *     summary: Get portfolio diversification issues
 *     tags: [Risk Management]
 *     security:
 *       - bearerAuth: []
 */
router.get('/risk/diversification-issues', authenticate, async (req, res) => {
  try {
    const correlationAnalysisService = diContainer.get('correlationAnalysisService');
    const issues = await correlationAnalysisService.getDiversificationIssues(req.user.wallet_id);
    res.json({ success: true, data: issues });
  } catch (error) {
    logger.error('Error fetching diversification issues:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PREDICTIVE ALERTS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/alerts/active:
 *   get:
 *     summary: Get active predictive alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/alerts/active', authenticate, async (req, res) => {
  try {
    const predictiveAlertService = diContainer.get('predictiveAlertService');
    const alerts = await predictiveAlertService.getActiveAlerts(req.user.wallet_id);
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Error fetching active alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/alerts/critical:
 *   get:
 *     summary: Get critical alerts
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/alerts/critical', authenticate, async (req, res) => {
  try {
    const predictiveAlertService = diContainer.get('predictiveAlertService');
    const alerts = await predictiveAlertService.getCriticalAlerts(req.user.wallet_id);
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Error fetching critical alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/alerts/:alertId/acknowledge', authenticate, async (req, res) => {
  try {
    const predictiveAlertService = diContainer.get('predictiveAlertService');
    const alert = await predictiveAlertService.acknowledgeAlert(req.params.alertId);
    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SENTIMENT ANALYSIS ROUTES
// ============================================================================

/**
 * @swagger
 * /api/sentiment/bullish:
 *   get:
 *     summary: Get bullish sentiment opportunities
 *     tags: [Sentiment Analysis]
 */
router.get('/sentiment/bullish', async (req, res) => {
  try {
    const sentimentAnalysisService = diContainer.get('sentimentAnalysisService');
    const opportunities = await sentimentAnalysisService.getBullishOpportunities();
    res.json({ success: true, data: opportunities });
  } catch (error) {
    logger.error('Error fetching bullish opportunities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/sentiment/token/{tokenMint}:
 *   get:
 *     summary: Get sentiment data for a token
 *     tags: [Sentiment Analysis]
 */
router.get('/sentiment/token/:tokenMint', async (req, res) => {
  try {
    const sentimentAnalysisService = diContainer.get('sentimentAnalysisService');
    const sentiment = await sentimentAnalysisService.getLatestSentiment(req.params.tokenMint);
    res.json({ success: true, data: sentiment });
  } catch (error) {
    logger.error('Error fetching token sentiment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/signals/high-quality:
 *   get:
 *     summary: Get high-quality social signals
 *     tags: [Social Signals]
 */
router.get('/signals/high-quality', async (req, res) => {
  try {
    const socialSignalService = diContainer.get('socialSignalService');
    const signals = await socialSignalService.getHighQualitySignals();
    res.json({ success: true, data: signals });
  } catch (error) {
    logger.error('Error fetching high-quality signals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CROSS-CHAIN BRIDGE ROUTES
// ============================================================================

/**
 * @swagger
 * /api/bridge/initiate:
 *   post:
 *     summary: Initiate a cross-chain bridge transaction
 *     tags: [Cross-Chain Bridge]
 *     security:
 *       - bearerAuth: []
 */
router.post('/bridge/initiate', authenticate, async (req, res) => {
  try {
    const crossChainBridgeService = diContainer.get('crossChainBridgeService');
    const tx = await crossChainBridgeService.initiateBridge(req.user.wallet_id, req.body);
    res.json({ success: true, data: tx });
  } catch (error) {
    logger.error('Error initiating bridge:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/bridge/history:
 *   get:
 *     summary: Get bridge transaction history
 *     tags: [Cross-Chain Bridge]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bridge/history', authenticate, async (req, res) => {
  try {
    const crossChainBridgeService = diContainer.get('crossChainBridgeService');
    const history = await crossChainBridgeService.getWalletBridgeHistory(req.user.wallet_id);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('Error fetching bridge history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/bridge/{bridgeTxId}/retry:
 *   post:
 *     summary: Retry a failed bridge transaction
 *     tags: [Cross-Chain Bridge]
 *     security:
 *       - bearerAuth: []
 */
router.post('/bridge/:bridgeTxId/retry', authenticate, async (req, res) => {
  try {
    const crossChainBridgeService = diContainer.get('crossChainBridgeService');
    const tx = await crossChainBridgeService.retryFailedBridge(req.params.bridgeTxId);
    res.json({ success: true, data: tx });
  } catch (error) {
    logger.error('Error retrying bridge:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// JITO BUNDLE ROUTES
// ============================================================================

/**
 * @swagger
 * /api/jito/bundles:
 *   post:
 *     summary: Create a Jito bundle
 *     tags: [Jito Bundles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/jito/bundles', authenticate, async (req, res) => {
  try {
    const jitoBundleService = diContainer.get('jitoBundleService');
    const bundle = await jitoBundleService.createBundle(req.user.wallet_id, req.body);
    res.json({ success: true, data: bundle });
  } catch (error) {
    logger.error('Error creating Jito bundle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/jito/bundles/{bundleId}/submit:
 *   post:
 *     summary: Submit a Jito bundle
 *     tags: [Jito Bundles]
 *     security:
 *       - bearerAuth: []
 */
router.post('/jito/bundles/:bundleId/submit', authenticate, async (req, res) => {
  try {
    const jitoBundleService = diContainer.get('jitoBundleService');
    const bundle = await jitoBundleService.submitBundle(req.params.bundleId);
    res.json({ success: true, data: bundle });
  } catch (error) {
    logger.error('Error submitting Jito bundle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/jito/bundles:
 *   get:
 *     summary: Get Jito bundles for wallet
 *     tags: [Jito Bundles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/jito/bundles', authenticate, async (req, res) => {
  try {
    const jitoBundleService = diContainer.get('jitoBundleService');
    const bundles = await jitoBundleService.getBundlesByWallet(req.user.wallet_id);
    res.json({ success: true, data: bundles });
  } catch (error) {
    logger.error('Error fetching Jito bundles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/jito/stats:
 *   get:
 *     summary: Get Jito bundle statistics
 *     tags: [Jito Bundles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/jito/stats', authenticate, async (req, res) => {
  try {
    const jitoBundleService = diContainer.get('jitoBundleService');
    const stats = await jitoBundleService.getBundleStats(req.user.wallet_id);
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching Jito stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TRADE HISTORY AGGREGATION ROUTES
// ============================================================================

/**
 * @swagger
 * /api/trades/search:
 *   get:
 *     summary: Search trades with full-text search
 *     tags: [Trade History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         description: Search query
 *         schema:
 *           type: string
 *       - name: strategy_type
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: start_date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: end_date
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/trades/search', authenticate, async (req, res) => {
  try {
    const tradeHistoryAggregationService = diContainer.get('tradeHistoryAggregationService');
    const trades = await tradeHistoryAggregationService.searchTrades(
      req.user.wallet_id,
      req.query.q,
      req.query
    );
    res.json({ success: true, data: trades });
  } catch (error) {
    logger.error('Error searching trades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/trades/statistics:
 *   get:
 *     summary: Get trade statistics
 *     tags: [Trade History]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trades/statistics', authenticate, async (req, res) => {
  try {
    const tradeHistoryAggregationService = diContainer.get('tradeHistoryAggregationService');
    const stats = await tradeHistoryAggregationService.getTradeStatistics(
      req.user.wallet_id,
      req.query.start_date,
      req.query.end_date
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching trade statistics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/trades/export:
 *   get:
 *     summary: Export trades to CSV
 *     tags: [Trade History]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trades/export', authenticate, async (req, res) => {
  try {
    const tradeHistoryAggregationService = diContainer.get('tradeHistoryAggregationService');
    const exportData = await tradeHistoryAggregationService.exportTradesToCSV(
      req.user.wallet_id,
      req.query
    );

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);

    // Convert to CSV string
    const csvContent = [
      exportData.headers.join(','),
      ...exportData.rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    res.send(csvContent);
  } catch (error) {
    logger.error('Error exporting trades:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CACHE MANAGEMENT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Cache Management]
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const advancedCacheService = diContainer.get('advancedCacheService');
    const stats = advancedCacheService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching cache stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/cleanup:
 *   post:
 *     summary: Clean up expired cache entries
 *     tags: [Cache Management]
 */
router.post('/cache/cleanup', async (req, res) => {
  try {
    const advancedCacheService = diContainer.get('advancedCacheService');
    await advancedCacheService.cleanup();
    res.json({ success: true, message: 'Cache cleanup completed' });
  } catch (error) {
    logger.error('Error during cache cleanup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;