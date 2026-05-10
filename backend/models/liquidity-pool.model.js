const { query } = require('../db/connection');
const logger = require('../utils/logger');

class LiquidityPoolModel {
  // Create a new liquidity pool record
  static async createPool(poolData) {
    const {
      pool_address,
      token_a_mint,
      token_a_symbol,
      token_b_mint,
      token_b_symbol,
      total_liquidity_usd,
      token_a_reserves,
      token_b_reserves,
      fee_tier,
      pool_program,
      created_on_chain
    } = poolData;

    const sql = `
      INSERT INTO liquidity_pools (
        pool_address, token_a_mint, token_a_symbol, token_b_mint, token_b_symbol,
        total_liquidity_usd, token_a_reserves, token_b_reserves, fee_tier,
        pool_program, created_on_chain
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (pool_address) DO UPDATE SET
        total_liquidity_usd = EXCLUDED.total_liquidity_usd,
        token_a_reserves = EXCLUDED.token_a_reserves,
        token_b_reserves = EXCLUDED.token_b_reserves,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      pool_address, token_a_mint, token_a_symbol, token_b_mint, token_b_symbol,
      total_liquidity_usd, token_a_reserves, token_b_reserves, fee_tier,
      pool_program, created_on_chain
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Liquidity pool created/updated: ${result.rows[0].pool_id}`);
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

  // Get all active positions for a wallet
  static async getPositionsByWallet(wallet_id) {
    const sql = `
      SELECT lp.*, lp.pool_id, lp.total_liquidity_usd
      FROM liquidity_positions lp
      JOIN liquidity_pools lp ON lp.pool_id = lp.pool_id
      WHERE lp.wallet_id = $1 AND lp.is_active = true
      ORDER BY lp.created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching liquidity positions:', error);
      throw error;
    }
  }

  // Claim fees from a liquidity position
  static async claimFees(position_id, fees_amount) {
    const sql = `
      UPDATE liquidity_positions
      SET unclaimed_fees = 0, total_fees_earned = total_fees_earned + $1, fee_yielded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE position_id = $2
      RETURNING *
    `;
    try {
      const result = await query(sql, [fees_amount, position_id]);
      logger.info(`Fees claimed for position: ${position_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error claiming fees:', error);
      throw error;
    }
  }

  // Close a liquidity position
  static async closePosition(position_id) {
    const sql = `
      UPDATE liquidity_positions
      SET is_active = false, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE position_id = $1
      RETURNING *
    `;
    try {
      const result = await query(sql, [position_id]);
      logger.info(`Liquidity position closed: ${position_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error closing position:', error);
      throw error;
    }
  }

  static async getPoolById(pool_id) {
    const sql = 'SELECT * FROM liquidity_pools WHERE pool_id = $1';
    try {
      const result = await query(sql, [pool_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching pool:', error);
      throw error;
    }
  }
}

module.exports = LiquidityPoolModel;
