const express = require('express');
const { authenticate } = require('../middleware/auth');
const NotificationModel = require('../models/notification.model');
const logger = require('../utils/logger');

const router = express.Router();

// Get all notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const notifications = await NotificationModel.getByUserId(
      req.user.userId,
      parseInt(limit),
      parseInt(offset)
    );

    const unreadCount = await NotificationModel.getUnreadCount(req.user.userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const updated = await NotificationModel.markAsRead(notificationId, req.user.userId);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
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

// Delete notification
router.delete('/:notificationId', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;

    await NotificationModel.delete(notificationId, req.user.userId);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
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

// Get notification preferences
router.get('/preferences/get', authenticate, async (req, res) => {
  try {
    const preferences = await NotificationModel.getPreferences(req.user.userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update notification preferences
router.put('/preferences/update', authenticate, async (req, res) => {
  try {
    const {
      emailEnabled,
      smsEnabled,
      pushEnabled,
      webhookEnabled,
      webhookUrl,
      emailAddress,
      phoneNumber,
      doNotDisturbStart,
      doNotDisturbEnd,
      quietHoursEnabled
    } = req.body;

    const updated = await NotificationModel.updatePreferences(req.user.userId, {
      emailEnabled,
      smsEnabled,
      pushEnabled,
      webhookEnabled,
      webhookUrl,
      emailAddress,
      phoneNumber,
      doNotDisturbStart,
      doNotDisturbEnd,
      quietHoursEnabled
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
