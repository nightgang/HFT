const { query } = require('../db/connection');
const logger = require('../utils/logger');

class JitoBundleModel {
  // Create a Jito bundle record
  static async create(bundleData) {
    const {
      wallet_id,
      bundle_uuid,
      bundle_nonce,
      transaction_count,
      tip_amount
    } = bundleData;

    const sql = `
      INSERT INTO jito_bundles (
        wallet_id, bundle_uuid, bundle_nonce, transaction_count, tip_amount
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [wallet_id, bundle_uuid, bundle_nonce, transaction_count, tip_amount];

    try {
      const result = await query(sql, values);
      logger.info(`Jito bundle created: ${result.rows[0].bundle_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating Jito bundle:', error);
      throw error;
    }
  }

  // Update bundle status
  static async updateStatus(bundle_id, status, landed_slot = null) {
    const sql = `
      UPDATE jito_bundles
      SET status = $1, bundle_confirmation_status = $1, 
          ${landed_slot ? 'landed_at = CURRENT_TIMESTAMP, landed_slot = $2' : ''}
      WHERE bundle_id = $3
      RETURNING *
    `;

    let values;
    if (landed_slot) {
      values = [status, landed_slot, bundle_id];
    } else {
      values = [status, bundle_id];
    }

    try {
      const result = await query(sql, values);
      logger.info(`Jito bundle status updated: ${bundle_id} -> ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating bundle status:', error);
      throw error;
    }
  }

  // Mark bundle as submitted
  static async markSubmitted(bundle_id) {
    const sql = `
      UPDATE jito_bundles
      SET status = 'accepted', submitted_at = CURRENT_TIMESTAMP
      WHERE bundle_id = $1
      RETURNING *
    `;
    try {
      const result = await query(sql, [bundle_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error marking bundle as submitted:', error);
      throw error;
    }
  }

  // Get bundles by wallet
  static async getBundlesByWallet(wallet_id) {
    const sql = `
      SELECT * FROM jito_bundles
      WHERE wallet_id = $1
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching bundles:', error);
      throw error;
    }
  }

  // Get pending bundles
  static async getPendingBundles() {
    const sql = `
      SELECT * FROM jito_bundles
      WHERE status IN ('pending', 'accepted')
      ORDER BY created_at ASC
    `;
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching pending bundles:', error);
      throw error;
    }
  }

  // Get bundle statistics
  static async getBundleStats(wallet_id) {
    const sql = `
      SELECT
        COUNT(*) as total_bundles,
        SUM(CASE WHEN status = 'landed' THEN 1 ELSE 0 END) as landed_bundles,
        SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped_bundles,
        SUM(CASE WHEN status IN ('pending', 'accepted') THEN 1 ELSE 0 END) as pending_bundles,
        SUM(tip_amount) as total_tips_paid,
        AVG(tip_amount) as avg_tip_amount
      FROM jito_bundles
      WHERE wallet_id = $1
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching bundle statistics:', error);
      throw error;
    }
  }

  static async getById(bundle_id) {
    const sql = 'SELECT * FROM jito_bundles WHERE bundle_id = $1';
    try {
      const result = await query(sql, [bundle_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching bundle:', error);
      throw error;
    }
  }
}

module.exports = JitoBundleModel;
