// Price Alert Service - Real-time price monitoring and notifications
// Monitors token prices and triggers alerts based on user-defined thresholds

const logger = require('../utils/logger');
const { query } = require('../db/connection');

const EventEmitter = require('events');

class PriceAlertService extends EventEmitter {
  constructor() {
    super();
    this.activeAlerts = new Map();
    this.alertHistory = new Map();
    this.checkInterval = 30000; // Check every 30 seconds
    this.maxAlerts = 100; // Per user limit
  }

  /**
   * Create a price alert
   */
  async createAlert(walletId, tokenMint, alertType, threshold, notifyVia = ['email', 'webhook']) {
    try {
      // Validate input
      if (!['above', 'below', 'change_percent'].includes(alertType)) {
        throw new Error('Invalid alert type');
      }

      // Check alert limit
      const existingAlerts = await query(
        `SELECT COUNT(*) as count FROM price_alerts WHERE wallet_id = $1 AND is_active = true`,
        [walletId]
      );

      if (parseInt(existingAlerts.rows[0].count) >= this.maxAlerts) {
        throw new Error(`Maximum active alerts (${this.maxAlerts}) reached`);
      }

      // Insert alert
      const result = await query(
        `INSERT INTO price_alerts 
         (wallet_id, token_mint, alert_type, threshold, notify_via, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [walletId, tokenMint, alertType, threshold, JSON.stringify(notifyVia)]
      );

      logger.info(`Price alert created for ${tokenMint}`, {
        alertId: result.rows[0].id,
        type: alertType,
        threshold
      });

      // Add to active alerts
      const alertKey = `${walletId}_${tokenMint}_${alertType}`;
      this.activeAlerts.set(alertKey, result.rows[0]);

      return result.rows[0];
    } catch (error) {
      logger.error('Create price alert error', error);
      throw error;
    }
  }

  /**
   * Check all active alerts against current prices
   */
  async checkAllAlerts() {
    try {
      const alerts = await query(
        `SELECT * FROM price_alerts WHERE is_active = true`
      );

      for (const alert of alerts.rows) {
        const triggered = await this.evaluateAlert(alert);
        
        if (triggered) {
          await this.triggerAlert(alert);
        }
      }
    } catch (error) {
      logger.error('Error checking alerts', error);
    }
  }

  /**
   * Evaluate if alert should be triggered
   */
  async evaluateAlert(alert) {
    try {
      // Get current price (integrate with market data service)
      const currentPrice = await this.getCurrentPrice(alert.token_mint);
      
      if (!currentPrice) return false;

      let shouldTrigger = false;

      switch (alert.alert_type) {
        case 'above':
          shouldTrigger = currentPrice > alert.threshold;
          break;
        case 'below':
          shouldTrigger = currentPrice < alert.threshold;
          break;
        case 'change_percent': {
          const lastPrice = alert.last_checked_price || currentPrice;
          const changePercent = ((currentPrice - lastPrice) / lastPrice) * 100;
          shouldTrigger = Math.abs(changePercent) >= alert.threshold;
          break;
        }
      }

      // Update last checked
      if (shouldTrigger) {
        await query(
          `UPDATE price_alerts SET last_triggered_at = NOW() WHERE id = $1`,
          [alert.id]
        );
      }

      return shouldTrigger;
    } catch (error) {
      logger.error('Alert evaluation error', error);
      return false;
    }
  }

  /**
   * Trigger alert notifications
   */
  async triggerAlert(alert) {
    try {
      const notifyVia = JSON.parse(alert.notify_via);

      if (notifyVia.includes('email')) {
        this.emit('send-email-alert', {
          walletId: alert.wallet_id,
          tokenMint: alert.token_mint,
          alertType: alert.alert_type,
          threshold: alert.threshold
        });
      }

      if (notifyVia.includes('webhook')) {
        this.emit('send-webhook', {
          alertId: alert.id,
          walletId: alert.wallet_id,
          triggered: true,
          timestamp: new Date()
        });
      }

      if (notifyVia.includes('sms')) {
        this.emit('send-sms-alert', {
          walletId: alert.wallet_id,
          message: `Price Alert: ${alert.token_mint} triggered ${alert.alert_type} ${alert.threshold}`
        });
      }

      // Record in history
      await query(
        `INSERT INTO price_alert_history (alert_id, triggered_at) VALUES ($1, NOW())`,
        [alert.id]
      );

      logger.info(`Price alert triggered: ${alert.token_mint}`, {
        type: alert.alert_type,
        threshold: alert.threshold
      });
    } catch (error) {
      logger.error('Alert trigger error', error);
    }
  }

  /**
   * Get current price for token
   */
  async getCurrentPrice(tokenMint) {
    try {
      // Integration point - would call Jupiter or other price service
      // For now, return mock price
      return Math.random() * 1000; // Mock price
    } catch (error) {
      logger.error('Error getting current price', error);
      return null;
    }
  }

  /**
   * Disable alert
   */
  async disableAlert(alertId) {
    try {
      await query(
        `UPDATE price_alerts SET is_active = false WHERE id = $1`,
        [alertId]
      );

      logger.info(`Price alert disabled: ${alertId}`);
    } catch (error) {
      logger.error('Disable alert error', error);
      throw error;
    }
  }

  /**
   * Get user's alerts
   */
  async getUserAlerts(walletId) {
    try {
      const result = await query(
        `SELECT * FROM price_alerts WHERE wallet_id = $1 ORDER BY created_at DESC`,
        [walletId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Get user alerts error', error);
      throw error;
    }
  }

  /**
   * Start alert monitoring service
   */
  startMonitoring() {
    logger.info('Starting price alert monitoring service');
    
    this.monitoringInterval = setInterval(() => {
      this.checkAllAlerts();
    }, this.checkInterval);
  }

  /**
   * Stop alert monitoring service  
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      logger.info('Price alert monitoring service stopped');
    }
  }
}

module.exports = new PriceAlertService();
