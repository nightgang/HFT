const express = require('express');
const logger = require('../utils/logger');
const arbitrageEngine = require('../services/engines/arbitrage.engine');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/check/:tokenMint', authenticate, async (req, res) => {
  try {
    const { tokenMint } = req.params;
    const result = await arbitrageEngine.detectArbitrageOpportunity(tokenMint);
    const opportunity = Array.isArray(result.opportunities) && result.opportunities.length > 0
      ? result.opportunities[0]
      : {
          type: 'NO_OPPORTUNITY',
          tokenMint,
          estimatedProfitPct: 0,
          buyDex: null,
          sellDex: null,
          risk: 'NONE',
          signal: 'NO_ARBITRAGE_FOUND',
          note: 'No arbitrage opportunity found',
          timestamp: Date.now(),
        };

    res.json({
      ...opportunity,
      opportunities: result.opportunities || [],
    });
  } catch (error) {
    logger.error('Arbitrage check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

