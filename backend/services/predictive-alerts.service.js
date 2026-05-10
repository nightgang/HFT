const { PredictiveAlertModel, AnomalyLogModel } = require('../models/predictive-alert.model');
const logger = require('../utils/logger');

class PredictiveAlertService {
  // Create an alert
  async createAlert(alertData) {
    try {
      const alert = await PredictiveAlertModel.create(alertData);
      logger.info(`Alert created: ${alert.alert_id}`);
      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  // Detect anomalies and create alerts
  async detectAnomalies(walletId, metrics) {
    try {
      const alerts = [];

      // Price movement detection
      if (metrics.price_change_percent > 20) {
        const alert = await this.createAlert({
          wallet_id: walletId,
          alert_type: 'price_movement',
          severity: Math.abs(metrics.price_change_percent) > 50 ? 'critical' : 'warning',
          detected_pattern: `Sharp price move: ${metrics.price_change_percent.toFixed(2)}%`,
          confidence_score: 95,
          token_mint: metrics.token_mint,
          token_symbol: metrics.token_symbol,
          message: `${metrics.token_symbol} price changed ${metrics.price_change_percent.toFixed(2)}% in the last 24 hours`,
          recommendation: 'Review position and consider rebalancing'
        });
        alerts.push(alert);
      }

      // Volatility spike detection
      if (metrics.volatility > 0.5) {
        const alert = await this.createAlert({
          wallet_id: walletId,
          alert_type: 'volatility_spike',
          severity: 'warning',
          detected_pattern: `Volatility spike: ${metrics.volatility.toFixed(2)}`,
          confidence_score: 88,
          token_mint: metrics.token_mint,
          token_symbol: metrics.token_symbol,
          message: `Elevated volatility detected for ${metrics.token_symbol}`,
          recommendation: 'Monitor position carefully'
        });
        alerts.push(alert);
      }

      // Failure pattern detection
      if (metrics.failed_trades > 5) {
        const alert = await this.createAlert({
          wallet_id: walletId,
          alert_type: 'failure_pattern',
          severity: 'warning',
          detected_pattern: `${metrics.failed_trades} consecutive failed trades`,
          confidence_score: 85,
          message: `Pattern of failed trades detected (${metrics.failed_trades} in a row)`,
          recommendation: 'Review trading strategy and risk parameters'
        });
        alerts.push(alert);
      }

      logger.info(`Anomaly detection completed: ${alerts.length} alerts created`);
      return alerts;
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  // Get active alerts
  async getActiveAlerts(walletId) {
    try {
      const alerts = await PredictiveAlertModel.getActiveAlerts(walletId);
      return alerts;
    } catch (error) {
      logger.error('Error fetching active alerts:', error);
      throw error;
    }
  }

  // Get critical alerts
  async getCriticalAlerts(walletId) {
    try {
      const alerts = await PredictiveAlertModel.getCriticalAlerts(walletId);
      return alerts;
    } catch (error) {
      logger.error('Error fetching critical alerts:', error);
      throw error;
    }
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId) {
    try {
      const alert = await PredictiveAlertModel.acknowledgeAlert(alertId);
      logger.info(`Alert acknowledged: ${alertId}`);
      return alert;
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId) {
    try {
      const alert = await PredictiveAlertModel.resolveAlert(alertId);
      logger.info(`Alert resolved: ${alertId}`);
      return alert;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }
}

class AnomalyDetectionService {
  // Log anomaly
  async logAnomaly(anomalyData) {
    try {
      const log = await AnomalyLogModel.log(anomalyData);
      logger.info(`Anomaly logged: ${anomalyData.anomaly_type}`);
      return log;
    } catch (error) {
      logger.error('Error logging anomaly:', error);
      throw error;
    }
  }

  // Detect based on statistical analysis (Z-score)
  async detectStatisticalAnomalies(walletId, currentMetrics, historicalMetrics) {
    try {
      const anomalies = [];

      // Calculate z-score for each metric
      const mean = this.calculateMean(historicalMetrics);
      const stdDev = this.calculateStdDev(historicalMetrics, mean);

      Object.entries(currentMetrics).forEach(([metric, value]) => {
        const zScore = (value - mean) / stdDev;
        
        if (Math.abs(zScore) > 2) {
          // Anomaly detected (beyond 2 standard deviations)
          const log = this.logAnomaly({
            wallet_id: walletId,
            anomaly_type: 'statistical_deviation',
            metric_name: metric,
            metric_value: value,
            expected_value: mean,
            detection_algorithm: 'z_score_analysis',
            confidence_score: Math.min(Math.abs(zScore) * 25, 99)
          });
          anomalies.push(log);
        }
      });

      return anomalies;
    } catch (error) {
      logger.error('Error detecting statistical anomalies:', error);
      throw error;
    }
  }

  // Get recent anomalies
  async getRecentAnomalies(walletId, hoursBack = 24) {
    try {
      const anomalies = await AnomalyLogModel.getRecentAnomalies(walletId, hoursBack);
      return anomalies;
    } catch (error) {
      logger.error('Error fetching recent anomalies:', error);
      throw error;
    }
  }

  // Calculate mean
  calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  // Calculate standard deviation
  calculateStdDev(values, mean) {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

module.exports = { PredictiveAlertService: new PredictiveAlertService(), AnomalyDetectionService: new AnomalyDetectionService() };
