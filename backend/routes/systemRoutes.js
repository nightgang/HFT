const express = require('express');
const logger = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const autoTradeService = require('../services/auto-trade.service');

const router = express.Router();

/**
 * @swagger
 * /api/system/autotrade:
 *   get:
 *     summary: Get current auto trade status
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current auto trade status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 AUTO_TRADE:
 *                   type: boolean
 *                   description: True if auto trade is enabled
 *                 status:
 *                   type: string
 *                   enum: [ON, OFF]
 *                 timestamp:
 *                   type: string
 */
router.get('/autotrade', authenticate, (req, res) => {
  try {
    const status = autoTradeService.getStatus();
    logger.info(`Auto Trade status requested: ${status.status}`);
    res.json(status);
  } catch (error) {
    logger.error('Error fetching auto trade status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/system/autotrade:
 *   post:
 *     summary: Toggle or set auto trade status
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Set auto trade to ON (true) or OFF (false)
 *               action:
 *                 type: string
 *                 enum: [toggle, set]
 *                 description: 'toggle: flip current state, set: use enabled value'
 *     responses:
 *       200:
 *         description: Auto trade status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 AUTO_TRADE:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   enum: [ON, OFF]
 *                 timestamp:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.post('/autotrade', authenticate, (req, res) => {
  try {
    const { enabled, action = 'set' } = req.body;

    let newStatus;
    if (action === 'toggle') {
      newStatus = autoTradeService.toggle();
    } else {
      // Default action: 'set'
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'enabled parameter must be a boolean'
        });
      }
      newStatus = autoTradeService.setStatus(enabled);
    }

    const statusResponse = {
      success: true,
      AUTO_TRADE: newStatus,
      status: newStatus ? 'ON' : 'OFF',
      timestamp: new Date().toISOString(),
      message: `Auto Trade ${newStatus ? 'enabled' : 'disabled'}`
    };

    logger.info(`Auto Trade updated by user: ${statusResponse.status}`);

    // The WebSocket broadcast will be handled by a middleware or service subscriber
    res.json(statusResponse);
  } catch (error) {
    logger.error('Error updating auto trade status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/system/autotrade/toggle:
 *   post:
 *     summary: Toggle auto trade status (shorthand)
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto trade toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 AUTO_TRADE:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                   enum: [ON, OFF]
 *                 timestamp:
 *                   type: string
 */
router.post('/autotrade/toggle', authenticate, (req, res) => {
  try {
    const newStatus = autoTradeService.toggle();

    const statusResponse = {
      success: true,
      AUTO_TRADE: newStatus,
      status: newStatus ? 'ON' : 'OFF',
      timestamp: new Date().toISOString(),
      message: `Auto Trade ${newStatus ? 'enabled' : 'disabled'}`
    };

    logger.info(`Auto Trade toggled: ${statusResponse.status}`);

    res.json(statusResponse);
  } catch (error) {
    logger.error('Error toggling auto trade status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
