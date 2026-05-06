const express = require('express');
const logger = require('../utils/logger');
const sniperEngine = require('../services/engines/sniper.engine');

const router = express.Router();

router.post('/start', (req, res) => {
  try {
    sniperEngine.start();
    res.json({ success: true, message: 'Sniper started' });
  } catch (error) {
    logger.error('Start sniper error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/stop', (req, res) => {
  try {
    sniperEngine.stop();
    res.json({ success: true, message: 'Sniper stopped' });
  } catch (error) {
    logger.error('Stop sniper error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json(sniperEngine.getStatus());
});

router.post('/detect', async (req, res) => {
  try {
    await sniperEngine.processTokenDetection(req.body);
    res.json({ success: true, message: 'Token detection processed' });
  } catch (error) {
    logger.error('Sniper detect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/enable-auto-trade', (req, res) => {
  try {
    sniperEngine.enableAutoTrade();
    res.json({ success: true, message: 'Auto trade enabled' });
  } catch (error) {
    logger.error('Enable auto trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/disable-auto-trade', (req, res) => {
  try {
    sniperEngine.disableAutoTrade();
    res.json({ success: true, message: 'Auto trade disabled' });
  } catch (error) {
    logger.error('Disable auto trade error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
