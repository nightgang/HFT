const axios = require('axios');
const logger = require('../../utils/logger');
const metricsService = require('../monitoring/metrics.service');

class AlertingService {
  constructor() {
    this.alertConfigs = {
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        enabled: !!process.env.SLACK_WEBHOOK_URL
      },
      pagerduty: {
        routingKey: process.env.PAGERDUTY_ROUTING_KEY,
        enabled: !!process.env.PAGERDUTY_ROUTING_KEY
      }
    };

    // Alert thresholds
    this.thresholds = {
      errorRate: 5, // 5% error rate threshold
      latency: 5000, // 5 second latency threshold
      tradeFailureRate: 10, // 10% trade failure rate
      systemDownTime: 300000, // 5 minutes system down
      riskViolationRate: 3 // 3 violations per hour
    };

    // Alert state tracking
    this.activeAlerts = new Map();
    this.alertCooldowns = new Map();
    this.alertCooldownMs = 300000; // 5 minutes cooldown between similar alerts
  }

  // Send alert to all configured channels
  async sendAlert(severity, title, message, details = {}) {
    const alertId = `${severity}_${title}_${Date.now()}`;

    try {
      // Check cooldown
      if (this.isAlertOnCooldown(title)) {
        logger.debug(`Alert on cooldown: ${title}`);
        return;
      }

      const alert = {
        id: alertId,
        severity,
        title,
        message,
        details,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      };

      // Send to all enabled channels
      const promises = [];

      if (this.alertConfigs.slack.enabled) {
        promises.push(this.sendSlackAlert(alert));
      }

      if (this.alertConfigs.pagerduty.enabled) {
        promises.push(this.sendPagerDutyAlert(alert));
      }

      await Promise.allSettled(promises);

      // Track active alert
      this.activeAlerts.set(alertId, alert);
      this.alertCooldowns.set(title, Date.now() + this.alertCooldownMs);

      // Record metrics
      metricsService.recordError('alert', severity);

      logger.info(`Alert sent: ${severity} - ${title}`);
    } catch (error) {
      logger.error('Failed to send alert:', error);
    }
  }

  // Send Slack alert
  async sendSlackAlert(alert) {
    try {
      const color = this.getSeverityColor(alert.severity);
      const payload = {
        attachments: [{
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Environment',
              value: alert.environment,
              short: true
            },
            {
              title: 'Time',
              value: alert.timestamp,
              short: true
            }
          ],
          footer: 'HFT Trading System',
          ts: Date.now() / 1000
        }]
      };

      // Add details if provided
      if (Object.keys(alert.details).length > 0) {
        payload.attachments[0].fields.push({
          title: 'Details',
          value: JSON.stringify(alert.details, null, 2),
          short: false
        });
      }

      await axios.post(this.alertConfigs.slack.webhookUrl, payload, {
        timeout: 10000
      });

      logger.debug('Slack alert sent successfully');
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
      throw error;
    }
  }

  // Send PagerDuty alert
  async sendPagerDutyAlert(alert) {
    try {
      const severity = alert.severity === 'critical' ? 'critical' :
                      alert.severity === 'high' ? 'error' :
                      alert.severity === 'medium' ? 'warning' : 'info';

      const payload = {
        routing_key: this.alertConfigs.pagerduty.routingKey,
        event_action: 'trigger',
        dedup_key: alert.id,
        payload: {
          summary: alert.title,
          source: 'hft-trading-backend',
          severity,
          component: 'trading-system',
          group: 'hft-system',
          class: 'alert',
          custom_details: {
            message: alert.message,
            details: alert.details,
            environment: alert.environment,
            timestamp: alert.timestamp
          }
        }
      };

      await axios.post('https://events.pagerduty.com/v2/enqueue', payload, {
        timeout: 10000
      });

      logger.debug('PagerDuty alert sent successfully');
    } catch (error) {
      logger.error('Failed to send PagerDuty alert:', error);
      throw error;
    }
  }

  // Get severity color for Slack
  getSeverityColor(severity) {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'warning';
      case 'low': return 'good';
      default: return '#808080';
    }
  }

  // Check if alert is on cooldown
  isAlertOnCooldown(title) {
    const cooldownUntil = this.alertCooldowns.get(title);
    return cooldownUntil && Date.now() < cooldownUntil;
  }

  // Monitor system health and send alerts
  async monitorSystemHealth() {
    try {
      // Check error rates
      await this.checkErrorRate();

      // Check latency
      await this.checkLatency();

      // Check trade failure rate
      await this.checkTradeFailureRate();

      // Check risk violations
      await this.checkRiskViolations();

      // Check system uptime
      await this.checkSystemHealth();

    } catch (error) {
      logger.error('System health monitoring failed:', error);
    }
  }

  // Check error rate threshold
  async checkErrorRate() {
    try {
      // Get error count from last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // This would query error metrics from database or metrics store
      // For now, simulate based on metrics
      const errorRate = await this.getErrorRate(fiveMinutesAgo);

      if (errorRate > this.thresholds.errorRate) {
        await this.sendAlert(
          'high',
          'High Error Rate Detected',
          `Error rate is ${errorRate.toFixed(2)}% (threshold: ${this.thresholds.errorRate}%)`,
          { errorRate, threshold: this.thresholds.errorRate }
        );
      }
    } catch (error) {
      logger.error('Error rate check failed:', error);
    }
  }

  // Check latency threshold
  async checkLatency() {
    try {
      const avgLatency = await this.getAverageLatency();

      if (avgLatency > this.thresholds.latency) {
        await this.sendAlert(
          'medium',
          'High Latency Detected',
          `Average latency is ${avgLatency}ms (threshold: ${this.thresholds.latency}ms)`,
          { avgLatency, threshold: this.thresholds.latency }
        );
      }
    } catch (error) {
      logger.error('Latency check failed:', error);
    }
  }

  // Check trade failure rate
  async checkTradeFailureRate() {
    try {
      const failureRate = await this.getTradeFailureRate();

      if (failureRate > this.thresholds.tradeFailureRate) {
        await this.sendAlert(
          'high',
          'High Trade Failure Rate',
          `Trade failure rate is ${failureRate.toFixed(2)}% (threshold: ${this.thresholds.tradeFailureRate}%)`,
          { failureRate, threshold: this.thresholds.tradeFailureRate }
        );
      }
    } catch (error) {
      logger.error('Trade failure rate check failed:', error);
    }
  }

  // Check risk violation rate
  async checkRiskViolations() {
    try {
      const violationRate = await this.getRiskViolationRate();

      if (violationRate > this.thresholds.riskViolationRate) {
        await this.sendAlert(
          'medium',
          'High Risk Violation Rate',
          `Risk violation rate is ${violationRate} per hour (threshold: ${this.thresholds.riskViolationRate})`,
          { violationRate, threshold: this.thresholds.riskViolationRate }
        );
      }
    } catch (error) {
      logger.error('Risk violation check failed:', error);
    }
  }

  // Check system health
  async checkSystemHealth() {
    try {
      // Check database connectivity
      const dbHealthy = await this.checkDatabaseHealth();
      if (!dbHealthy) {
        await this.sendAlert(
          'critical',
          'Database Unhealthy',
          'Database connection is down or unresponsive',
          { component: 'database' }
        );
      }

      // Check Redis connectivity
      const redisHealthy = await this.checkRedisHealth();
      if (!redisHealthy) {
        await this.sendAlert(
          'critical',
          'Redis Unhealthy',
          'Redis connection is down or unresponsive',
          { component: 'redis' }
        );
      }

      // Check WebSocket server
      const wsHealthy = await this.checkWebSocketHealth();
      if (!wsHealthy) {
        await this.sendAlert(
          'high',
          'WebSocket Server Unhealthy',
          'WebSocket server is not responding',
          { component: 'websocket' }
        );
      }

    } catch (error) {
      logger.error('System health check failed:', error);
    }
  }

  // Mock methods for getting metrics (would integrate with actual metrics store)
  async getErrorRate(_since) {
    // Mock implementation - would query actual error metrics
    return Math.random() * 10;
  }

  async getAverageLatency() {
    // Mock implementation
    return Math.random() * 10000;
  }

  async getTradeFailureRate() {
    // Mock implementation
    return Math.random() * 20;
  }

  async getRiskViolationRate() {
    // Mock implementation
    return Math.random() * 10;
  }

  async checkDatabaseHealth() {
    try {
      const { query } = require('../../db/connection');
      await query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkRedisHealth() {
    // Mock Redis health check
    return true;
  }

  async checkWebSocketHealth() {
    // Mock WebSocket health check
    return true;
  }

  // Send heartbeat alert
  async sendHeartbeat() {
    try {
      await this.sendAlert(
        'low',
        'System Heartbeat',
        'HFT Trading System is running normally',
        {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      logger.error('Heartbeat alert failed:', error);
    }
  }

  // Resolve alert
  async resolveAlert(alertId, _resolution = 'Resolved automatically') {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) return;

      // Send resolution to PagerDuty if configured
      if (this.alertConfigs.pagerduty.enabled) {
        const payload = {
          routing_key: this.alertConfigs.pagerduty.routingKey,
          event_action: 'resolve',
          dedup_key: alertId,
          payload: {
            summary: `Resolved: ${alert.title}`,
            source: 'hft-trading-backend'
          }
        };

        await axios.post('https://events.pagerduty.com/v2/enqueue', payload, {
          timeout: 10000
        });
      }

      this.activeAlerts.delete(alertId);
      logger.info(`Alert resolved: ${alertId}`);
    } catch (error) {
      logger.error('Failed to resolve alert:', error);
    }
  }

  // Get active alerts
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  // Configure alert channels
  configureChannel(channel, config) {
    if (this.alertConfigs[channel]) {
      this.alertConfigs[channel] = { ...this.alertConfigs[channel], ...config };
      logger.info(`Alert channel ${channel} configured`);
    }
  }

  // Update alert thresholds
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Alert thresholds updated:', this.thresholds);
  }
}

module.exports = new AlertingService();