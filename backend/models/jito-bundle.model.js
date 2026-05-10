const { query } = require('../db/connection');
const logger = require('../utils/logger');

class JitoBundleModel {
  // Create a Jito bundle record
  static async create(bundleData) {
    const {
      wallet_id,
      bundle_hash,
      status,
      transactions,
      tip_amount_lamports,
      priority_fee_lamports,
      metadata
    } = bundleData;

    const sql = `
      INSERT INTO jito_bundles (
        wallet_id, bundle_hash, status, transactions, tip_amount_lamports,
        priority_fee_lamports, submitted_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      RETURNING *
    `;

    const values = [
      wallet_id, bundle_hash, status || 'pending', transactions,
      tip_amount_lamports, priority_fee_lamports, metadata
    ];

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
  static async updateStatus(bundle_id, status, slot_landed = null, mev_reward = null) {
    let sql = `
      UPDATE jito_bundles
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `;
    const values = [status];
    let paramIndex = 2;

    if (slot_landed) {
      sql += `, landed_at = CURRENT_TIMESTAMP, slot_landed = $${paramIndex}`;
      values.push(slot_landed);
      paramIndex++;
    }

    if (mev_reward) {
      sql += `, mev_reward_lamports = $${paramIndex}`;
      values.push(mev_reward);
      paramIndex++;
    }

    sql += ` WHERE bundle_id = $${paramIndex} RETURNING *`;
    values.push(bundle_id);

    try {
      const result = await query(sql, values);
      logger.info(`Jito bundle status updated: ${bundle_id} -> ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating Jito bundle status:', error);
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

  // Get bundle by ID
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

  // Get bundles for wallet
  static async getByWallet(wallet_id) {
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
        SUM(tip_amount_lamports) as total_tips_paid,
        AVG(tip_amount_lamports) as avg_tip_amount
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
}

module.exports = JitoBundleModel;
