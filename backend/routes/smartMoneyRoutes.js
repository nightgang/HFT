const express = require('express');
const logger = require('../utils/logger');
const smartMoneyEngine = require('../services/engines/smartmoney.engine');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/signal/random', authenticate, async (req, res) => {
  try {
    const signal = await smartMoneyEngine.getRandomSmartMoneySignal();
    res.json(signal);
  } catch (error) {
    logger.error('Smart money random signal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/signal/:walletAddress', authenticate, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const signal = await smartMoneyEngine.getSmartMoneySignal(walletAddress);
    res.json(signal);
  } catch (error) {
    logger.error('Smart money signal error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/signals', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const signals = await smartMoneyEngine.getSampleSmartMoneySignals(limit);
    res.json({ signals });
  } catch (error) {
    logger.error('Smart money signals error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:walletAddress', authenticate, async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const analysis = await smartMoneyEngine.analyzeWallet(walletAddress);
    res.json(analysis);
  } catch (error) {
    logger.error('Smart money analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

