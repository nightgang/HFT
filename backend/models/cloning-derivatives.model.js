const { query } = require('../db/connection');
const logger = require('../utils/logger');

class PositionCloneModel {
  // Create position clone configuration
  static async createCloneConfig(configData) {
    const {
      wallet_id,
      source_wallet_address,
      source_wallet_label,
      clone_mode,
      scale_factor,
      copy_type,
      delay_minutes,
      max_copy_value,
      min_position_size
    } = configData;

    const sql = `
      INSERT INTO position_clones (
        wallet_id, source_wallet_address, source_wallet_label,
        clone_mode, scale_factor, copy_type, delay_minutes,
        max_copy_value, min_position_size
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_id, source_wallet_address, source_wallet_label,
        clone_mode, scale_factor, copy_type, delay_minutes,
        max_copy_value, min_position_size
      ]);
      logger.info(`Position clone config created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating position clone config:', error);
      throw error;
    }
  }

  // Record clone execution
  static async recordExecution(executionData) {
    const {
      clone_config_id,
      source_tx_hash,
      source_entry_price,
      source_quantity,
      cloned_quantity,
      cloned_price,
      clone_tx_hash,
      status,
      skip_reason
    } = executionData;

    const sql = `
      INSERT INTO clone_executions (
        clone_config_id, source_tx_hash, source_entry_price,
        source_quantity, cloned_quantity, cloned_price,
        clone_tx_hash, status, skip_reason
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        clone_config_id, source_tx_hash, source_entry_price,
        source_quantity, cloned_quantity, cloned_price,
        clone_tx_hash, status, skip_reason
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording clone execution:', error);
      throw error;
    }
  }

  // Get clone executions
  static async getExecutions(cloneConfigId) {
    const sql = `
      SELECT * FROM clone_executions
      WHERE clone_config_id = $1
      ORDER BY created_at DESC
    `;

    try {
      const result = await query(sql, [cloneConfigId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching clone executions:', error);
      throw error;
    }
  }

  // Update clone execution with P&L
  static async updateExecutionPnL(executionId, sourcePnL, clonedPnL) {
    const sql = `
      UPDATE clone_executions
      SET source_pnl = $2, cloned_pnl = $3, executed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [executionId, sourcePnL, clonedPnL]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating clone execution P&L:', error);
      throw error;
    }
  }

  // Get clone config stats
  static async getConfigStats(cloneConfigId) {
    const sql = `
      SELECT
        COUNT(*) as total_copies,
        SUM(CASE WHEN status = 'executed' THEN 1 ELSE 0 END) as successful_copies,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped_copies,
        SUM(cloned_pnl) as total_pnl,
        AVG(cloned_pnl) as avg_pnl
      FROM clone_executions
      WHERE clone_config_id = $1
    `;

    try {
      const result = await query(sql, [cloneConfigId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching clone stats:', error);
      throw error;
    }
  }
}

class OptionsFuturesModel {
  // Create options/futures position
  static async createPosition(positionData) {
    const {
      wallet_id,
      underlying_token,
      position_type,
      contract_type,
      strike_price,
      expiry_date,
      quantity,
      entry_price,
      leverage
    } = positionData;

    const sql = `
      INSERT INTO options_futures_positions (
        wallet_id, underlying_token, position_type, contract_type,
        strike_price, expiry_date, quantity, entry_price, leverage
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_id, underlying_token, position_type, contract_type,
        strike_price, expiry_date, quantity, entry_price, leverage
      ]);
      logger.info(`Options/Futures position created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating options/futures position:', error);
      throw error;
    }
  }

  // Get active positions
  static async getActivePositions(walletId) {
    const sql = `
      SELECT * FROM options_futures_positions
      WHERE wallet_id = $1 AND status = 'open'
      ORDER BY opened_at DESC
    `;

    try {
      const result = await query(sql, [walletId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active positions:', error);
      throw error;
    }
  }

  // Update position mark-to-market
  static async updateMTM(positionId, currentPrice, currentValue, markToMarketPnL) {
    const sql = `
      UPDATE options_futures_positions
      SET current_price = $2, current_value = $3, mark_to_market_pnl = $4
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [positionId, currentPrice, currentValue, markToMarketPnL]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating position MTM:', error);
      throw error;
    }
  }

  // Close position
  static async closePosition(positionId) {
    const sql = `
      UPDATE options_futures_positions
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [positionId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error closing position:', error);
      throw error;
    }
  }

  // Create options/futures order
  static async createOrder(orderData) {
    const {
      position_id,
      wallet_id,
      order_type,
      side,
      quantity,
      price
    } = orderData;

    const sql = `
      INSERT INTO options_futures_orders (
        position_id, wallet_id, order_type, side, quantity, price
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    try {
      const result = await query(sql, [position_id, wallet_id, order_type, side, quantity, price]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating options/futures order:', error);
      throw error;
    }
  }

  // Get open orders
  static async getOpenOrders(walletId) {
    const sql = `
      SELECT * FROM options_futures_orders
      WHERE wallet_id = $1 AND status IN ('pending', 'partially_filled')
      ORDER BY created_at DESC
    `;

    try {
      const result = await query(sql, [walletId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching open orders:', error);
      throw error;
    }
  }

  // Update order fill
  static async updateOrderFill(orderId, filledQuantity, averageFillPrice) {
    const sql = `
      UPDATE options_futures_orders
      SET filled_quantity = $2, average_fill_price = $3,
          status = CASE WHEN $2 >= quantity THEN 'filled' ELSE 'partially_filled' END,
          filled_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [orderId, filledQuantity, averageFillPrice]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating order fill:', error);
      throw error;
    }
  }
}

module.exports = { PositionCloneModel, OptionsFuturesModel };
