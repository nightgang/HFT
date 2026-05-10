const { query, getClient } = require('../db/connection');
const logger = require('../utils/logger');

class TradeModel {
  // Create a new trade
  static async create(tradeData) {
    const {
      wallet_id,
      strategy_type,
      request_id,
      status = 'pending',
      direction,
      input_token_mint,
      input_token_symbol,
      input_amount,
      output_token_mint,
      output_token_symbol,
      expected_output_amount,
      actual_output_amount,
      expected_price,
      actual_price,
      slippage_percent,
      transaction_fee,
      priority_fee,
      total_cost_usd,
      executed_at,
      settlement_at,
      tx_signature,
      tx_confirmation_status,
      rpc_endpoint,
      pnl_usd,
      pnl_percent,
      notes,
      error_message
    } = tradeData;

    const sql = `
      INSERT INTO trades (
        wallet_id, strategy_type, request_id, status, direction,
        input_token_mint, input_token_symbol, input_amount,
        output_token_mint, output_token_symbol, expected_output_amount,
        actual_output_amount, expected_price, actual_price,
        slippage_percent, transaction_fee, priority_fee, total_cost_usd,
        executed_at, settlement_at, tx_signature, tx_confirmation_status,
        rpc_endpoint, pnl_usd, pnl_percent, notes, error_message
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
      )
      RETURNING *
    `;

    const values = [
      wallet_id, strategy_type, request_id, status, direction,
      input_token_mint, input_token_symbol, input_amount,
      output_token_mint, output_token_symbol, expected_output_amount,
      actual_output_amount, expected_price, actual_price,
      slippage_percent, transaction_fee, priority_fee, total_cost_usd,
      executed_at, settlement_at, tx_signature, tx_confirmation_status,
      rpc_endpoint, pnl_usd, pnl_percent, notes, error_message
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Trade created: ${result.rows[0].trade_id} for wallet ${wallet_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating trade:', error);
      throw error;
    }
  }

  // Get trade by ID
  static async getById(tradeId) {
    const sql = 'SELECT * FROM trades WHERE trade_id = $1';
    try {
      const result = await query(sql, [tradeId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting trade by ID:', error);
      throw error;
    }
  }

  // Get trades by wallet
  static async getByWallet(walletId, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM trades
      WHERE wallet_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    try {
      const result = await query(sql, [walletId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting trades by wallet:', error);
      throw error;
    }
  }

  // Get trades by strategy
  static async getByStrategy(strategyType, limit = 100, offset = 0) {
    const sql = `
      SELECT * FROM trades
      WHERE strategy_type = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    try {
      const result = await query(sql, [strategyType, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting trades by strategy:', error);
      throw error;
    }
  }

  // Get trades by wallet and date range
  static async getByWalletAndDateRange(walletId, startDate, endDate, limit = 1000) {
    const sql = `
      SELECT * FROM trades
      WHERE wallet_id = $1
      AND executed_at >= $2
      AND executed_at <= $3
      ORDER BY executed_at DESC
      LIMIT $4
    `;
    try {
      const result = await query(sql, [walletId, startDate, endDate, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting trades by wallet and date range:', error);
      throw error;
    }
  }

  // Get trade statistics
  static async getStatistics(walletId = null, strategyType = null, dateFrom = null, dateTo = null) {
    let whereClause = '';
    const values = [];
    let paramIndex = 1;

    if (walletId) {
      whereClause += ` AND wallet_id = $${paramIndex}`;
      values.push(walletId);
      paramIndex++;
    }

    if (strategyType) {
      whereClause += ` AND strategy_type = $${paramIndex}`;
      values.push(strategyType);
      paramIndex++;
    }

    if (dateFrom) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      values.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      values.push(dateTo);
      paramIndex++;
    }

    const sql = `
      SELECT
        COUNT(*) as total_trades,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_trades,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_trades,
        SUM(pnl_usd) as total_pnl,
        AVG(pnl_percent) as avg_pnl_percent,
        SUM(total_cost_usd) as total_cost,
        AVG(slippage_percent) as avg_slippage
      FROM trades
      WHERE 1=1 ${whereClause}
    `;

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting trade statistics:', error);
      throw error;
    }
  }

  // Get recent trades
  static async getRecent(limit = 50) {
    const sql = `
      SELECT t.*, w.wallet_name
      FROM trades t
      LEFT JOIN wallets w ON t.wallet_id = w.wallet_id
      ORDER BY t.created_at DESC
      LIMIT $1
    `;
    try {
      const result = await query(sql, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent trades:', error);
      throw error;
    }
  }

  // Delete old trades (for cleanup)
  static async deleteOldTrades(daysOld = 90) {
    const sql = `
      DELETE FROM trades
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      AND status IN ('completed', 'failed')
    `;
    try {
      const result = await query(sql);
      logger.info(`Deleted ${result.rowCount} old trades older than ${daysOld} days`);
      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting old trades:', error);
      throw error;
    }
  }
}

module.exports = TradeModel;