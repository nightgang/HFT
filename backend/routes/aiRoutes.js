const express = require('express');
const logger = require('../utils/logger');
const predictionEngine = require('../services/engines/prediction.engine');

const router = express.Router();

/**
 * /api/ai/predict
 * Accepts a token mint and optional metadata/marketData, then returns an AI score.
 */
router.post('/predict', async (req, res) => {
  try {
    const { tokenMint, metadata = {}, marketData = {} } = req.body;

    if (!tokenMint) {
      return res.status(400).json({ success: false, error: 'tokenMint is required' });
    }

    const prediction = await predictionEngine.scoreTrade(tokenMint, {
      ...metadata,
      marketData
    });

    res.json({
      success: true,
      data: prediction,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('AI prediction route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/risk-assessment', async (req, res) => {
  try {
    const { tokenMint, metadata = {}, marketData = {} } = req.body;

    if (!tokenMint) {
      return res.status(400).json({ success: false, error: 'tokenMint is required' });
    }

    const riskResult = await predictionEngine.assessRisk(tokenMint, {
      metadata,
      marketData
    });

    res.json({
      success: true,
      data: riskResult,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('AI risk assessment route error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
