/**
 * Katana Mode Routes
 *
 * API endpoints for Katana Mode trading system.
 * Provides REST API access to Katana engine functions.
 */

const express = require('express');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const katanaEngine = require('../services/engines/katana.engine');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/katana/status:
 *   get:
 *     summary: Get Katana Mode status
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Katana status information
 */
router.get('/status', (req, res) => {
  try {
    const status = katanaEngine.getStatus();
    res.json({
      success: true,
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Katana status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Katana status'
    });
  }
});

/**
 * @swagger
 * /api/katana/start:
 *   post:
 *     summary: Start Katana Mode
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Katana Mode started successfully
 */
router.post('/start', async (req, res) => {
  try {
    await katanaEngine.start();
    res.json({
      success: true,
      message: 'Katana Mode started',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Katana start error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start Katana Mode'
    });
  }
});

/**
 * @swagger
 * /api/katana/stop:
 *   post:
 *     summary: Stop Katana Mode
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Katana Mode stopped successfully
 */
router.post('/stop', async (req, res) => {
  try {
    await katanaEngine.stop();
    res.json({
      success: true,
      message: 'Katana Mode stopped',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Katana stop error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop Katana Mode'
    });
  }
});

/**
 * @swagger
 * /api/katana/trade:
 *   post:
 *     summary: Execute a Katana trade
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               side:
 *                 type: string
 *                 enum: [buy, sell]
 *               tokenMint:
 *                 type: string
 *               amount:
 *                 type: number
 *               slippage:
 *                 type: number
 *               walletId:
 *                 type: string
 *               useJito:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Trade executed successfully
 */
router.post('/trade', async (req, res) => {
  try {
    const { side, tokenMint, amount, slippage, walletId, useJito } = req.body;

    // Validate required fields
    if (!side || !tokenMint || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: side, tokenMint, amount'
      });
    }

    // Get wallet (simplified - would get from wallet service)
    const wallet = await getWalletById(walletId || req.user.defaultWallet);
    if (!wallet) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet'
      });
    }

    const tradeParams = {
      side,
      tokenMint,
      amount: parseFloat(amount),
      slippage: slippage ? parseFloat(slippage) : undefined,
      wallet,
      useJito: useJito || false
    };

    const result = await katanaEngine.executeTrade(tradeParams);

    res.json({
      success: true,
      data: result,
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Katana trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute trade'
    });
  }
});

/**
 * @swagger
 * /api/katana/detect-token:
 *   post:
 *     summary: Manually trigger token detection
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenMint:
 *                 type: string
 *               liquidity:
 *                 type: number
 *               marketCap:
 *                 type: number
 *     responses:
 *       200:
 *         description: Token detection processed
 */
router.post('/detect-token', async (req, res) => {
  try {
    const { tokenMint, liquidity, marketCap } = req.body;

    if (!tokenMint) {
      return res.status(400).json({
        success: false,
        error: 'tokenMint is required'
      });
    }

    const tokenData = {
      mint: tokenMint,
      liquidity: liquidity || 0,
      marketCap: marketCap || 0,
      detectedAt: Date.now()
    };

    await katanaEngine.detectNewToken(tokenData);

    res.json({
      success: true,
      message: 'Token detection processed',
      timestamp: Date.now()
    });

  } catch (error) {
    logger.error('Katana token detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process token detection'
    });
  }
});

/**
 * @swagger
 * /api/katana/config:
 *   get:
 *     summary: Get Katana configuration
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Katana configuration
 */
router.get('/config', (req, res) => {
  try {
    const config = {
      strategy: katanaEngine.strategy.config,
      risk: katanaEngine.risk.config,
      executor: katanaEngine.executor.config,
      websocket: katanaEngine.ws.config
    };

    res.json({
      success: true,
      data: config,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Katana config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Katana config'
    });
  }
});

/**
 * @swagger
 * /api/katana/positions:
 *   get:
 *     summary: Get active positions
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active positions data
 */
router.get('/positions', (req, res) => {
  try {
    const positions = katanaEngine.strategy.getAllPositions();
    const summary = katanaEngine.strategy.getPositionsSummary();

    res.json({
      success: true,
      data: {
        positions,
        summary
      },
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Katana positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get positions'
    });
  }
});

/**
 * @swagger
 * /api/katana/stats:
 *   get:
 *     summary: Get Katana statistics
 *     tags: [Katana]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Katana statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      engine: katanaEngine.getStatus(),
      executor: katanaEngine.executor.getExecutionStats(),
      risk: katanaEngine.risk.getRiskStats(),
      websocket: katanaEngine.ws.getStats()
    };

    res.json({
      success: true,
      data: stats,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Katana stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Katana stats'
    });
  }
});

// Helper function to get wallet by ID
async function getWalletById(walletId) {
  // This would integrate with the existing wallet service
  // For now, return a mock wallet
  return {
    id: walletId,
    publicKey: new (require('@solana/web3.js').PublicKey)('11111111111111111111111111111112'), // Mock
    keypair: null // Would be decrypted from storage
  };
}

module.exports = router;</content>
<parameter name="filePath">/workspaces/HFT/backend/routes/katanaRoutes.js