const express = require('express');
const { authenticate } = require('../middleware/auth');
const AlertModel = require('../models/alert.model');
const logger = require('../utils/logger');

const router = express.Router();

// Create a new trading alert
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      alertName,
      alertType,
      severity = 'medium',
      conditionJson,
      tokenMint,
      expiresAt
    } = req.body;

    if (!alertName || !alertType || !conditionJson) {
      return res.status(400).json({
        success: false,
        error: 'alertName, alertType, and conditionJson are required'
      });
    }

    const alert = await AlertModel.create(req.user.userId, {
      alertName,
      alertType,
      severity,
      conditionJson,
      tokenMint,
      expiresAt
    });

    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all alerts for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const alerts = await AlertModel.getByUserId(req.user.userId);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get single alert by ID
router.get('/:alertId', authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await AlertModel.getById(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    if (alert.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    logger.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update alert
router.put('/:alertId', authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;
    const {
      alertName,
      alertType,
      severity,
      conditionJson,
      tokenMint,
      status
    } = req.body;

    const updated = await AlertModel.update(alertId, req.user.userId, {
      alertName,
      alertType,
      severity,
      conditionJson,
      tokenMint,
      status
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error('Error updating alert:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete alert
router.delete('/:alertId', authenticate, async (req, res) => {
  try {
    const { alertId } = req.params;

    await AlertModel.delete(alertId, req.user.userId);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
