const express = require('express');
const logger = require('../utils/logger');
const tradingEngine = require('../services/engines/trading.engine');
const { authenticate } = require('../middleware/auth');
const auditLogger = require('../utils/audit');

const router = express.Router();

// Wallet routes - require authentication for sensitive operations
router.post('/wallet/create', authenticate, (req, res) => {
  try {
    const { name, deterministic } = req.body;
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

router.post('/wallet/connect', authenticate, (req, res) => {
  try {
    const { publicKey, name } = req.body;
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

module.exports = router;

