const express = require('express');
const logger = require('../utils/logger');
const tradingEngine = require('../services/engines/trading.engine');
const { authenticate } = require('../middleware/auth');
const auditLogger = require('../utils/audit');
const WalletModel = require('../models/wallet.model');
const walletRepository = require('../repositories/wallet.repository');
const correlationService = require('../services/correlation.service');
const rebalancingService = require('../services/portfolio-rebalancing.service');
const twapService = require('../services/twap.service');
const executionAnalyticsService = require('../services/execution-analytics.service');
const backtestingService = require('../services/backtesting.service');
const emailService = require('../services/email.service');
const emailScheduler = require('../services/email-scheduler.service');
const taxExportService = require('../services/tax-export.service');
const walletRecoveryService = require('../services/wallet-recovery.service');
const {
  createWalletSchema,
  connectWalletSchema,
  multisigWalletSchema,
  taxExportRequestSchema,
  walletHierarchySchema,
  walletLimitsSchema,
  walletRecoverySchema,
  addressListSchema
} = require('../utils/validator');

const router = express.Router();

/**
 * @swagger
 * /api/trading/wallet/create:
 *   post:
 *     summary: Create a new trading wallet
 *     tags: [Trading, Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Wallet name
 *               deterministic:
 *                 type: boolean
 *                 description: Whether to use deterministic key generation
 *     responses:
 *       200:
 *         description: Wallet created successfully
 *       500:
 *         description: Internal server error
 */
router.post('/wallet/create', authenticate, (req, res) => {
  try {
    const { name, deterministic } = createWalletSchema.parse(req.body);
    const wallet = tradingEngine.createWallet(name, deterministic);

    // Audit wallet creation
    auditLogger.logWalletOperation('create', wallet.publicKey, true, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      wallet: {
        name: wallet.name,
        publicKey: wallet.publicKey.toString(),
      }
    });
  } catch (error) {
    // Audit failed wallet creation
    auditLogger.logWalletOperation('create', null, false, req.ip, req.get('User-Agent'));

    logger.error('Create wallet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/trading/wallet/connect:
 *   post:
 *     summary: Connect an external wallet
 *     tags: [Trading, Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publicKey:
 *                 type: string
 *                 description: Solana public key
 *               name:
 *                 type: string
 *                 description: Wallet name
 *     responses:
 *       200:
 *         description: Wallet connected successfully
 *       500:
 *         description: Internal server error
 */
router.post('/wallet/connect', authenticate, (req, res) => {
  try {
    const { publicKey, name } = connectWalletSchema.parse(req.body);
    const wallet = tradingEngine.connectExternalWallet(publicKey, name);

    // Audit wallet connection
    auditLogger.logWalletOperation('connect', wallet.publicKey, true, req.ip, req.get('User-Agent'));

    res.json({
      success: true,
      wallet: {
        name: wallet.name,
        publicKey: wallet.publicKey.toString(),
      }
    });
  } catch (error) {
    // Audit failed wallet connection
    auditLogger.logWalletOperation('connect', req.body.publicKey, false, req.ip, req.get('User-Agent'));

    logger.error('Connect wallet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/set-active', authenticate, (req, res) => {
  try {
    const { publicKey } = req.body;
    tradingEngine.setActiveWallet(publicKey);

    // Audit wallet activation
    auditLogger.logWalletOperation('set-active', publicKey, true, req.ip, req.get('User-Agent'));

    res.json({ success: true, message: 'Active wallet set' });
  } catch (error) {
    // Audit failed wallet activation
    auditLogger.logWalletOperation('set-active', req.body.publicKey, false, req.ip, req.get('User-Agent'));

    logger.error('Set active wallet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/multisig/create', authenticate, async (req, res) => {
  try {
    const { name, signers, threshold, multisigAddress, notes } = req.body;

    if (!name || !Array.isArray(signers) || signers.length < 2) {
      return res.status(400).json({ success: false, error: 'Multisig wallet requires a name and at least two signers' });
    }

    const wallet = await tradingEngine.createMultisigWallet(name, signers, threshold || 2, multisigAddress, notes);

    auditLogger.logWalletOperation('create-multisig', wallet.walletAddress, true, req.ip, req.get('User-Agent'));
    res.json({ success: true, wallet });
  } catch (error) {
    auditLogger.logWalletOperation('create-multisig', null, false, req.ip, req.get('User-Agent'));
    logger.error('Create multisig wallet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallets/multisig', authenticate, async (req, res) => {
  try {
    const wallets = await tradingEngine.getMultisigWallets();
    res.json({ success: true, wallets });
  } catch (error) {
    logger.error('Get multisig wallets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/parent', authenticate, async (req, res) => {
  try {
    const { childWalletAddress, parentWalletAddress } = walletHierarchySchema.parse(req.body);
    const childWallet = await walletRepository.getByAddress(childWalletAddress);
    const parentWallet = await walletRepository.getByAddress(parentWalletAddress);

    if (!childWallet || !parentWallet) {
      return res.status(404).json({ success: false, error: 'Child or parent wallet not found' });
    }

    const updated = await walletRepository.update(childWallet.wallet_id, {
      parent_wallet_id: parentWallet.wallet_id,
      metadata: {
        ...childWallet.metadata,
        hierarchy: {
          parent: parentWallet.wallet_address,
          updatedAt: new Date().toISOString()
        }
      }
    });

    auditLogger.logWalletOperation('assign-parent-wallet', childWallet.wallet_address, true, req.ip, req.get('User-Agent'));
    res.json({ success: true, wallet: updated });
  } catch (error) {
    auditLogger.logWalletOperation('assign-parent-wallet', null, false, req.ip, req.get('User-Agent'));
    logger.error('Assign parent wallet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/settings', authenticate, async (req, res) => {
  try {
    const { walletAddress, spendingLimitUsd, dailySpendingUsd } = walletLimitsSchema.parse(req.body);
    const wallet = await walletRepository.getByAddress(walletAddress);

    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const updated = await walletRepository.update(wallet.wallet_id, {
      spending_limit_usd: spendingLimitUsd,
      daily_spending_usd: dailySpendingUsd ?? wallet.daily_spending_usd ?? 0
    });

    auditLogger.logWalletOperation('update-wallet-limits', walletAddress, true, req.ip, req.get('User-Agent'));
    res.json({ success: true, wallet: updated });
  } catch (error) {
    auditLogger.logWalletOperation('update-wallet-limits', null, false, req.ip, req.get('User-Agent'));
    logger.error('Update wallet limits error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallets/recover', authenticate, async (req, res) => {
  try {
    const { walletAddress, targetWalletAddress, execute } = walletRecoverySchema.parse(req.body);
    const plan = await walletRecoveryService.prepareRecoveryPlan(walletAddress, targetWalletAddress);

    if (execute) {
      const result = await walletRecoveryService.executeRecoveryPlan(walletAddress, targetWalletAddress);
      auditLogger.logWalletOperation('wallet-fund-recovery', walletAddress, true, req.ip, req.get('User-Agent'));
      return res.json({ success: true, plan, result });
    }

    auditLogger.logWalletOperation('wallet-fund-recovery-plan', walletAddress, true, req.ip, req.get('User-Agent'));
    res.json({ success: true, plan });
  } catch (error) {
    auditLogger.logWalletOperation('wallet-fund-recovery', req.body.walletAddress || null, false, req.ip, req.get('User-Agent'));
    logger.error('Wallet recovery error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallets/whitelist', authenticate, async (req, res) => {
  try {
    const { walletAddress, addresses } = addressListSchema.parse(req.body);
    const wallet = await walletRepository.getByAddress(walletAddress);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const updated = await walletRepository.update(wallet.wallet_id, {
      address_whitelist: addresses,
      metadata: {
        ...wallet.metadata,
        whitelistUpdatedAt: new Date().toISOString(),
      }
    });

    auditLogger.logWalletOperation('update-wallet-whitelist', walletAddress, true, req.ip, req.get('User-Agent'));
    res.json({ success: true, wallet: updated });
  } catch (error) {
    auditLogger.logWalletOperation('update-wallet-whitelist', null, false, req.ip, req.get('User-Agent'));
    logger.error('Update wallet whitelist error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallets/blacklist', authenticate, async (req, res) => {
  try {
    const { walletAddress, addresses } = addressListSchema.parse(req.body);
    const wallet = await walletRepository.getByAddress(walletAddress);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const updated = await walletRepository.update(wallet.wallet_id, {
      address_blacklist: addresses,
      metadata: {
        ...wallet.metadata,
        blacklistUpdatedAt: new Date().toISOString(),
      }
    });

    auditLogger.logWalletOperation('update-wallet-blacklist', walletAddress, true, req.ip, req.get('User-Agent'));
    res.json({ success: true, wallet: updated });
  } catch (error) {
    auditLogger.logWalletOperation('update-wallet-blacklist', null, false, req.ip, req.get('User-Agent'));
    logger.error('Update wallet blacklist error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallets/filters/:walletAddress', authenticate, async (req, res) => {
  try {
    const wallet = await walletRepository.getByAddress(req.params.walletAddress);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    res.json({
      success: true,
      whitelist: wallet.address_whitelist || [],
      blacklist: wallet.address_blacklist || []
    });
  } catch (error) {
    logger.error('Get wallet filters error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallets/performance/:walletAddress', authenticate, async (req, res) => {
  try {
    const wallet = await walletRepository.getByAddress(req.params.walletAddress);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Wallet not found' });
    }

    const performance = await WalletModel.getPerformance(wallet.wallet_id);
    res.json({ success: true, performance });
  } catch (error) {
    logger.error('Get wallet performance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallets', (req, res) => {
  res.json({
    wallets: tradingEngine.getWallets(),
    activeWallet: tradingEngine.getActiveWallet(),
  });
});

router.get('/portfolio/:walletPublicKey', async (req, res) => {
  try {
    const { walletPublicKey } = req.params;
    const portfolio = await tradingEngine.getPortfolioSummary(walletPublicKey);
    res.json(portfolio);
  } catch (error) {
    logger.error('Portfolio summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallet/active', (req, res) => {
  res.json({ activeWallet: tradingEngine.getActiveWallet() });
});

router.get('/wallet/:publicKey', (req, res) => {
  const wallet = tradingEngine.getWallet(req.params.publicKey);
  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }
  res.json({ success: true, wallet });
});

// Trades
router.get('/trades', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ trades: tradingEngine.getTradeHistory(limit) });
});

router.get('/trades/:walletPublicKey', (req, res) => {
  const { walletPublicKey } = req.params;
  const limit = parseInt(req.query.limit) || 50;
  res.json({ trades: tradingEngine.getTradesByWallet(walletPublicKey, limit) });
});

// Trade execution - require authentication
/**
 * @swagger
 * /api/trading/buy:
 *   post:
 *     summary: Execute a buy trade
 *     tags: [Trading, Execution]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletPublicKey:
 *                 type: string
 *                 description: Wallet public key
 *               tokenMint:
 *                 type: string
 *                 description: Token mint address
 *               amount:
 *                 type: number
 *                 description: Amount in SOL
 *               slippageBps:
 *                 type: integer
 *                 description: Slippage in basis points
 *     responses:
 *       200:
 *         description: Trade executed successfully
 *       500:
 *         description: Trade execution failed
 */
router.post('/buy', authenticate, async (req, res) => {
  try {
    const result = await tradingEngine.executeBuy(req.body);

    // Audit trade execution
    await auditLogger.logTradeExecution(
      result.wallet || req.body.walletPublicKey,
      req.body.tokenMint,
      req.body.amount,
      'buy',
      result.success !== false,
      req.ip,
      req.get('User-Agent')
    );

    res.json(result);
  } catch (error) {
    // Audit failed trade
    await auditLogger.logTradeExecution(
      req.body.walletPublicKey,
      req.body.tokenMint,
      req.body.amount,
      'buy',
      false,
      req.ip,
      req.get('User-Agent')
    );

    logger.error('Buy trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sell', authenticate, async (req, res) => {
  try {
    const result = await tradingEngine.executeSell(req.body);

    // Audit trade execution
    await auditLogger.logTradeExecution(
      result.wallet || req.body.walletPublicKey,
      req.body.tokenMint,
      req.body.amount,
      'sell',
      result.success !== false,
      req.ip,
      req.get('User-Agent')
    );

    res.json(result);
  } catch (error) {
    // Audit failed trade
    await auditLogger.logTradeExecution(
      req.body.walletPublicKey,
      req.body.tokenMint,
      req.body.amount,
      'sell',
      false,
      req.ip,
      req.get('User-Agent')
    );

    logger.error('Sell trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/unsigned', authenticate, async (req, res) => {
  try {
    const { type, tokenMint, amount, slippageBps } = req.body;
    const isBuy = type === 'buy';
    const swapTransaction = await tradingEngine.getUnsignedTransaction({
      tokenMint,
      amount,
      slippageBps,
    }, isBuy);

    res.json({
      success: true,
      type,
      tokenMint,
      amount,
      swapTransaction,
    });
  } catch (error) {
    logger.error('Unsigned trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Advanced Trading Features Routes

/**
 * @swagger
 * /api/trading/correlation/{tokenA}/{tokenB}:
 *   get:
 *     summary: Analyze correlation between two tokens
 *     tags: [Trading, Analytics]
 *     parameters:
 *       - in: path
 *         name: tokenA
 *         required: true
 *         schema:
 *           type: string
 *         description: First token mint address
 *       - in: path
 *         name: tokenB
 *         required: true
 *         schema:
 *           type: string
 *         description: Second token mint address
 *     responses:
 *       200:
 *         description: Correlation analysis result
 */
router.get('/correlation/:tokenA/:tokenB', async (req, res) => {
  try {
    const { tokenA, tokenB } = req.params;
    const result = await correlationService.analyzeTokenCorrelation(tokenA, tokenB);
    res.json(result);
  } catch (error) {
    logger.error('Correlation analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/correlation/:tokenMint/related', async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const { limit = 10 } = req.query;

    // Get some candidate tokens (in real implementation, this would be from a token registry)
    const candidates = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      'So11111111111111111111111111111111111111112', // SOL
    ];

    const result = await correlationService.getCorrelatedPairs(tokenMint, candidates);
    res.json({ tokenMint, correlatedPairs: result.slice(0, limit) });
  } catch (error) {
    logger.error('Related tokens correlation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Portfolio Rebalancing
router.get('/rebalance/:walletId/analyze', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { targetAllocations } = req.query;

    let allocations = {};
    if (targetAllocations) {
      allocations = JSON.parse(targetAllocations);
    }

    const result = await rebalancingService.analyzeRebalanceNeed(walletId, allocations);
    res.json(result);
  } catch (error) {
    logger.error('Rebalance analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/rebalance/:walletId/execute', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { targetAllocations } = req.body;

    const result = await rebalancingService.executeRebalance(walletId, targetAllocations);
    res.json(result);
  } catch (error) {
    logger.error('Rebalance execution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// TWAP Orders
router.post('/twap', authenticate, async (req, res) => {
  try {
    const result = await twapService.createTWAPOrder(req.body);
    res.json(result);
  } catch (error) {
    logger.error('TWAP order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/twap/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await twapService.getTWAPOrderStatus(orderId);
    res.json(result);
  } catch (error) {
    logger.error('TWAP order status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/twap/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await twapService.cancelTWAPOrder(orderId);
    res.json(result);
  } catch (error) {
    logger.error('TWAP order cancellation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/twap/active', async (req, res) => {
  try {
    const activeOrders = twapService.getActiveOrders();
    res.json({ activeOrders });
  } catch (error) {
    logger.error('Active TWAP orders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execution Analytics
router.get('/analytics/:walletId', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { days = 7 } = req.query;

    const analytics = await executionAnalyticsService.generateExecutionAnalytics(walletId, parseInt(days));
    res.json(analytics);
  } catch (error) {
    logger.error('Execution analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/backtest', authenticate, async (req, res) => {
  try {
    const backtestOptions = req.body;
    const result = await backtestingService.runBacktest(backtestOptions);
    res.json(result);
  } catch (error) {
    logger.error('Backtest execution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/backtest/strategies', authenticate, async (req, res) => {
  try {
    const strategies = backtestingService.getSupportedStrategies();
    res.json({ success: true, strategies });
  } catch (error) {
    logger.error('Backtest strategies error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/:walletId/comparison', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { days = 30 } = req.query;

    const comparison = await executionAnalyticsService.getPerformanceComparison(walletId, parseInt(days));
    res.json(comparison);
  } catch (error) {
    logger.error('Performance comparison error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/:walletId/metrics', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { days = 7 } = req.query;

    const analytics = await executionAnalyticsService.generateExecutionAnalytics(walletId, parseInt(days));
    res.json({ success: true, metrics: analytics });
  } catch (error) {
    logger.error('Dashboard metrics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard/:walletId/heatmap', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { days = 30 } = req.query;

    const analytics = await executionAnalyticsService.generateExecutionAnalytics(walletId, parseInt(days));
    res.json({ success: true, heatmap: analytics.tradeHeatmap });
  } catch (error) {
    logger.error('Dashboard heatmap error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Email Reports
router.post('/reports/weekly/:walletId', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address required' });
    }

    // Generate report data from execution analytics
    const analytics = await executionAnalyticsService.generateExecutionAnalytics(walletId, 7);

    const reportData = {
      totalTrades: analytics.totalTrades,
      profitableTrades: Math.floor(analytics.totalTrades * analytics.successRate / 100),
      totalPnL: analytics.pnl,
      winRate: analytics.successRate,
      bestTrade: analytics.bestTrade || 0,
      worstTrade: analytics.worstTrade || 0,
      totalVolume: analytics.totalVolume,
      topPerformers: analytics.topPerformers || [],
      alerts: analytics.alerts || []
    };

    const result = await emailService.sendWeeklyReport(email, reportData);
    res.json({ success: true, message: 'Weekly report sent successfully', email });
  } catch (error) {
    logger.error('Weekly report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/email/test', authenticate, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address required' });
    }

    const result = await emailService.testConfiguration(email);
    res.json(result);
  } catch (error) {
    logger.error('Email test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/alerts/trade', authenticate, async (req, res) => {
  try {
    const { email, tradeData } = req.body;

    if (!email || !tradeData) {
      return res.status(400).json({ success: false, error: 'Email and trade data required' });
    }

    const result = await emailService.sendTradeAlert(email, tradeData);
    res.json({ success: true, message: 'Trade alert sent successfully', email });
  } catch (error) {
    logger.error('Trade alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/alerts/system', authenticate, async (req, res) => {
  try {
    const { email, alertData } = req.body;

    if (!email || !alertData) {
      return res.status(400).json({ success: false, error: 'Email and alert data required' });
    }

    const result = await emailService.sendSystemAlert(email, alertData);
    res.json({ success: true, message: 'System alert sent successfully', email });
  } catch (error) {
    logger.error('System alert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scheduler/trigger-weekly', authenticate, async (req, res) => {
  try {
    await emailScheduler.triggerWeeklyReports();
    res.json({ success: true, message: 'Weekly reports triggered successfully' });
  } catch (error) {
    logger.error('Trigger weekly reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/scheduler/trigger-daily', authenticate, async (req, res) => {
  try {
    await emailScheduler.triggerDailySummaries();
    res.json({ success: true, message: 'Daily summaries triggered successfully' });
  } catch (error) {
    logger.error('Trigger daily summaries error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/scheduler/status', authenticate, async (req, res) => {
  try {
    const status = emailScheduler.getStatus();
    res.json({ success: true, status });
  } catch (error) {
    logger.error('Get scheduler status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tax Exports
router.post('/exports/tax/:walletId', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { format, year } = taxExportRequestSchema.parse(req.body);

    const result = await taxExportService.generateTaxExport(walletId, format, year);
    res.json(result);
  } catch (error) {
    logger.error('Tax export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/exports/:walletId', authenticate, async (req, res) => {
  try {
    const { walletId } = req.params;
    const exports = await taxExportService.listExports(walletId);
    res.json({ exports });
  } catch (error) {
    logger.error('List exports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

