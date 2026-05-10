const { query } = require('../db/connection');
const logger = require('../utils/logger');

class PredictiveAlertModel {
  // Create a new predictive alert
  static async create(alertData) {
    const {
      wallet_id,
      alert_type,
      severity,
      detected_pattern,
      confidence_score,
      token_mint,
      token_symbol,
      message,
      recommendation
    } = alertData;

    const sql = `
      INSERT INTO predictive_alerts (
        wallet_id, alert_type, severity, detected_pattern, confidence_score,
        token_mint, token_symbol, message, recommendation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      wallet_id, alert_type, severity, detected_pattern, confidence_score,
      token_mint, token_symbol, message, recommendation
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Predictive alert created: ${alert_type} for wallet ${wallet_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating predictive alert:', error);
      throw error;
    }
  }

  // Get active alerts for wallet
  static async getActiveAlerts(wallet_id) {
    const sql = `
      SELECT * FROM predictive_alerts
      WHERE wallet_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active alerts:', error);
      throw error;
    }
  }

  // Get critical alerts
  static async getCriticalAlerts(wallet_id) {
    const sql = `
      SELECT * FROM predictive_alerts
      WHERE wallet_id = $1 AND status = 'active' AND severity = 'critical'
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching critical alerts:', error);
      throw error;
    }
  }

  // Acknowledge an alert
  static async acknowledgeAlert(alert_id) {
    const sql = `
      UPDATE predictive_alerts
      SET status = 'acknowledged', acknowledged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE alert_id = $1
      RETURNING *
    `;
    try {
      const result = await query(sql, [alert_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Resolve an alert
  static async resolveAlert(alert_id) {
    const sql = `
      UPDATE predictive_alerts
      SET status = 'resolved', updated_at = CURRENT_TIMESTAMP
      WHERE alert_id = $1
      RETURNING *
    `;
    try {
      const result = await query(sql, [alert_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  static async getById(alert_id) {
    const sql = 'SELECT * FROM predictive_alerts WHERE alert_id = $1';
    try {
      const result = await query(sql, [alert_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching alert:', error);
      throw error;
    }
  }
}

class AnomalyLogModel {
  // Log an anomaly
  static async log(anomalyData) {
    const {
      wallet_id,
      anomaly_type,
      metric_name,
      metric_value,
      expected_value,
      detection_algorithm,
      confidence_score
    } = anomalyData;

    const deviation_percent = ((metric_value - expected_value) / expected_value) * 100;

    const sql = `
      INSERT INTO anomaly_logs (
        wallet_id, anomaly_type, metric_name, metric_value, expected_value,
        deviation_percent, detection_algorithm, confidence_score
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      wallet_id, anomaly_type, metric_name, metric_value, expected_value,
      deviation_percent, detection_algorithm, confidence_score
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Anomaly logged: ${anomaly_type}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error logging anomaly:', error);
      throw error;
    }
  }

  // Get recent anomalies
  static async getRecentAnomalies(wallet_id, hoursBack = 24) {
    const sql = `
      SELECT * FROM anomaly_logs
      WHERE wallet_id = $1
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching recent anomalies:', error);
      throw error;
    }
  }

  // Get anomalies by type
  static async getAnomaliesByType(wallet_id, anomaly_type) {
    const sql = `
      SELECT * FROM anomaly_logs
      WHERE wallet_id = $1 AND anomaly_type = $2
      ORDER BY created_at DESC
      LIMIT 100
    `;
    try {
      const result = await query(sql, [wallet_id, anomaly_type]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching anomalies by type:', error);
      throw error;
    }
  }
}

module.exports = { PredictiveAlertModel, AnomalyLogModel };
