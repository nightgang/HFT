const { query } = require('../db/connection');
const logger = require('../utils/logger');

class LimitOrderModel {
  // Create a new limit order
  static async create(orderData) {
    const {
      wallet_id,
      side,
      input_token_mint,
      input_token_symbol,
      input_amount,
      output_token_mint,
      output_token_symbol,
      limit_price,
      is_post_only,
      is_ioc,
      expires_at
    } = orderData;

    const sql = `
      INSERT INTO limit_orders (
        wallet_id, side, input_token_mint, input_token_symbol, input_amount,
        output_token_mint, output_token_symbol, limit_price, is_post_only, is_ioc,
        expires_at, remaining_amount
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $5)
      RETURNING *
    `;

    const values = [
      wallet_id, side, input_token_mint, input_token_symbol, input_amount,
      output_token_mint, output_token_symbol, limit_price, is_post_only, is_ioc,
      expires_at
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Limit order created: ${result.rows[0].order_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating limit order:', error);
      throw error;
    }
  }

  // Get open orders for a wallet
  static async getOpenOrdersByWallet(wallet_id) {
    const sql = `
      SELECT * FROM limit_orders
      WHERE wallet_id = $1 AND status IN ('open', 'partially_filled')
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching open orders:', error);
      throw error;
    }
  }

  // Get open orders by token pair
  static async getOpenOrdersByTokenPair(input_mint, output_mint) {
    const sql = `
      SELECT * FROM limit_orders
      WHERE input_token_mint = $1 AND output_token_mint = $2
      AND status IN ('open', 'partially_filled')
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY limit_price DESC
    `;
    try {
      const result = await query(sql, [input_mint, output_mint]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching orders by token pair:', error);
      throw error;
    }
  }

  // Update order with partial fill
  static async partialFill(order_id, filled_amount, fill_price, tx_signature) {
    const sql = `
      UPDATE limit_orders
      SET filled_amount = filled_amount + $1,
          remaining_amount = remaining_amount - $1,
          execution_tx_signatures = array_append(execution_tx_signatures, $3),
          average_fill_price = (average_fill_price * filled_amount + $2 * $1) / (filled_amount + $1),
          status = CASE
            WHEN (filled_amount + $1) >= input_amount THEN 'filled'
            ELSE 'partially_filled'
          END,
          updated_at = CURRENT_TIMESTAMP,
          filled_at = CASE WHEN (filled_amount + $1) >= input_amount THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE order_id = $4
      RETURNING *
    `;
    try {
      const result = await query(sql, [filled_amount, fill_price, tx_signature, order_id]);
      logger.info(`Limit order partially filled: ${order_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating order with partial fill:', error);
      throw error;
    }
  }

  // Cancel a limit order
  static async cancel(order_id) {
    const sql = `
      UPDATE limit_orders
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1 AND status IN ('open', 'partially_filled')
      RETURNING *
    `;
    try {
      const result = await query(sql, [order_id]);
      if (result.rows.length === 0) {
        throw new Error('Order not found or cannot be cancelled');
      }
      logger.info(`Limit order cancelled: ${order_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error cancelling limit order:', error);
      throw error;
    }
  }

  // Get order order book depth
  static async getOrderBookDepth(input_mint, output_mint, side, depth = 10) {
    const sql = `
      SELECT * FROM limit_orders
      WHERE input_token_mint = $1 AND output_token_mint = $2
      AND side = $3
      AND status IN ('open', 'partially_filled')
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY limit_price ${side === 'buy' ? 'DESC' : 'ASC'}
      LIMIT $4
    `;
    try {
      const result = await query(sql, [input_mint, output_mint, side, depth]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching order book depth:', error);
      throw error;
    }
  }

  static async getById(order_id) {
    const sql = 'SELECT * FROM limit_orders WHERE order_id = $1';
    try {
      const result = await query(sql, [order_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching order:', error);
      throw error;
    }
  }
}

module.exports = LimitOrderModel;
