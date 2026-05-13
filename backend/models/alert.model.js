const { query } = require('../db/connection');
const logger = require('../utils/logger');

class AlertModel {
  // Create a trading alert
  static async create(userId, alertData) {
    const {
      alertName,
      alertType,
      severity = 'medium',
      conditionJson,
      tokenMint,
      expiresAt
    } = alertData;

    const sql = `
      INSERT INTO trading_alerts (user_id, alert_name, alert_type, severity, condition_json, token_mint, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING alert_id, user_id, alert_name, alert_type, severity, status, condition_json, token_mint, created_at, updated_at, is_active
    `;

    const values = [userId, alertName, alertType, severity, JSON.stringify(conditionJson), tokenMint, expiresAt];

    try {
      const result = await query(sql, values);
      logger.info(`Alert created: ${result.rows[0].alert_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  // Get all alerts for a user
  static async getByUserId(userId) {
    const sql = `
      SELECT alert_id, user_id, alert_name, alert_type, severity, status, condition_json, token_mint, triggered_count, last_triggered_at, created_at, updated_at, is_active
      FROM trading_alerts
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    try {
      const result = await query(sql, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user alerts:', error);
      throw error;
    }
  }

  // Get single alert by ID
  static async getById(alertId) {
    const sql = `
      SELECT alert_id, user_id, alert_name, alert_type, severity, status, condition_json, token_mint, triggered_count, last_triggered_at, created_at, updated_at, is_active
      FROM trading_alerts
      WHERE alert_id = $1
    `;

    try {
      const result = await query(sql, [alertId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching alert by ID:', error);
      throw error;
    }
  }

  // Update alert
  static async update(alertId, userId, updateData) {
    const {
      alertName,
      alertType,
      severity,
      conditionJson,
      tokenMint,
      status
    } = updateData;

    const sql = `
      UPDATE trading_alerts
      SET alert_name = COALESCE($1, alert_name),
          alert_type = COALESCE($2, alert_type),
          severity = COALESCE($3, severity),
          condition_json = COALESCE($4, condition_json),
          token_mint = COALESCE($5, token_mint),
          status = COALESCE($6, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE alert_id = $7 AND user_id = $8
      RETURNING alert_id, user_id, alert_name, alert_type, severity, status, condition_json, token_mint, created_at, updated_at, is_active
    `;

    const values = [alertName, alertType, severity, conditionJson ? JSON.stringify(conditionJson) : null, tokenMint, status, alertId, userId];

    try {
      const result = await query(sql, values);
      if (result.rows.length === 0) {
        throw new Error('Alert not found or unauthorized');
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating alert:', error);
      throw error;
    }
  }

  // Delete alert
  static async delete(alertId, userId) {
    const sql = `
      UPDATE trading_alerts
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE alert_id = $1 AND user_id = $2
      RETURNING alert_id
    `;

    try {
      const result = await query(sql, [alertId, userId]);
      if (result.rows.length === 0) {
        throw new Error('Alert not found or unauthorized');
      }
      logger.info(`Alert deleted: ${alertId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting alert:', error);
      throw error;
    }
  }

  // Record alert trigger
  static async recordTrigger(alertId, triggerValue, actionTaken = null, tradeId = null) {
    const sqlUpdate = `
      UPDATE trading_alerts
      SET triggered_count = triggered_count + 1,
          last_triggered_at = CURRENT_TIMESTAMP,
          status = 'triggered'
      WHERE alert_id = $1
    `;

    const sqlInsert = `
      INSERT INTO alert_trigger_history (alert_id, trigger_value, action_taken, trade_id)
      VALUES ($1, $2, $3, $4)
      RETURNING trigger_id, alert_id, trigger_value, triggered_at
    `;

    try {
      await query(sqlUpdate, [alertId]);
      const result = await query(sqlInsert, [alertId, triggerValue, actionTaken, tradeId]);
      logger.info(`Alert trigger recorded: ${alertId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording alert trigger:', error);
      throw error;
    }
  }
}

module.exports = AlertModel;
