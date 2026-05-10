const { query } = require('../db/connection');
const logger = require('../utils/logger');

class LiquidityPoolModel {
  // Create a new liquidity pool record
  static async createPool(poolData) {
    const {
      wallet_id,
      pool_address,
      amm_provider,
      token_a_mint,
      token_a_symbol,
      token_a_amount,
      token_b_mint,
      token_b_symbol,
      token_b_amount,
      total_liquidity_usd,
      pool_share_percent,
      metadata
    } = poolData;

    const sql = `
      INSERT INTO liquidity_pools (
        wallet_id, pool_address, amm_provider, token_a_mint, token_a_symbol,
        token_a_amount, token_b_mint, token_b_symbol, token_b_amount,
        total_liquidity_usd, pool_share_percent, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      wallet_id, pool_address, amm_provider, token_a_mint, token_a_symbol,
      token_a_amount, token_b_mint, token_b_symbol, token_b_amount,
      total_liquidity_usd, pool_share_percent, metadata
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Liquidity pool created: ${result.rows[0].pool_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating liquidity pool:', error);
      throw error;
    }
  }

  // Create a liquidity position
  static async createPosition(positionData) {
    const {
      pool_id,
      wallet_id,
      lp_token_mint,
      lp_token_balance,
      pool_share_percent,
      token_a_contributed,
      token_b_contributed
    } = positionData;

    const sql = `
      INSERT INTO liquidity_positions (
        pool_id, wallet_id, lp_token_mint, lp_token_balance,
        pool_share_percent, token_a_contributed, token_b_contributed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [pool_id, wallet_id, lp_token_mint, lp_token_balance, pool_share_percent, token_a_contributed, token_b_contributed];

    try {
      const result = await query(sql, values);
      logger.info(`Liquidity position created: ${result.rows[0].position_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating liquidity position:', error);
      throw error;
    }
  }

  // Get pools by wallet
  static async getPoolsByWallet(wallet_id) {
    const sql = `
      SELECT * FROM liquidity_pools
      WHERE wallet_id = $1
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching liquidity pools:', error);
      throw error;
    }
  }

  // Get pool by ID
  static async getPoolById(pool_id) {
    const sql = 'SELECT * FROM liquidity_pools WHERE pool_id = $1';
    try {
      const result = await query(sql, [pool_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching liquidity pool:', error);
      throw error;
    }
  }

  // Update pool metrics
  static async updatePoolMetrics(pool_id, metrics) {
    const { total_liquidity_usd, pool_share_percent, fees_earned } = metrics;
    const sql = `
      UPDATE liquidity_pools
      SET total_liquidity_usd = $1, pool_share_percent = $2, fees_earned = $3, updated_at = CURRENT_TIMESTAMP
      WHERE pool_id = $4
      RETURNING *
    `;
    try {
      const result = await query(sql, [total_liquidity_usd, pool_share_percent, fees_earned, pool_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating pool metrics:', error);
      throw error;
    }
  }

  // Close pool (remove liquidity)
  static async closePool(pool_id) {
    const sql = `
      UPDATE liquidity_pools
      SET status = 'removed', removed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE pool_id = $1
      RETURNING *
    `;
    try {
      const result = await query(sql, [pool_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error closing liquidity pool:', error);
      throw error;
    }
  }
}

module.exports = LiquidityPoolModel;
