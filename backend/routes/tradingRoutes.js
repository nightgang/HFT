const express = require('express');
const logger = require('../utils/logger');
const tradingEngine = require('../services/engines/trading.engine');

const router = express.Router();

// Wallet routes
router.post('/wallet/create', (req, res) => {
  try {
    const { name, deterministic } = req.body;
    const wallet = tradingEngine.createWallet(name, deterministic);
    res.json({
      success: true,
      wallet: {
        name: wallet.name,
        publicKey: wallet.publicKey.toString(),
      }
    });
  } catch (error) {
    logger.error('Create wallet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/connect', (req, res) => {
  try {
    const { publicKey, name } = req.body;
    const wallet = tradingEngine.connectExternalWallet(publicKey, name);
    res.json({
      success: true,
      wallet: {
        name: wallet.name,
        publicKey: wallet.publicKey.toString(),
      }
    });
  } catch (error) {
    logger.error('Connect wallet error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wallet/set-active', (req, res) => {
  try {
    const { publicKey } = req.body;
    tradingEngine.setActiveWallet(publicKey);
    res.json({ success: true, message: 'Active wallet set' });
  } catch (error) {
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

router.get('/wallet/:publicKey', (req, res) => {
  const wallet = tradingEngine.getWallet(req.params.publicKey);
  if (!wallet) {
    return res.status(404).json({ success: false, error: 'Wallet not found' });
  }
  res.json({ success: true, wallet });
});

router.get('/wallet/active', (req, res) => {
  res.json({ activeWallet: tradingEngine.getActiveWallet() });
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

// Trade execution
router.post('/buy', async (req, res) => {
  try {
    const result = await tradingEngine.executeBuy(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Buy trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/sell', async (req, res) => {
  try {
    const result = await tradingEngine.executeSell(req.body);
    res.json(result);
  } catch (error) {
    logger.error('Sell trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/unsigned', async (req, res) => {
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

