const { query } = require('../db/connection');
const logger = require('../utils/logger');

class AdvancedOrderModel {
  // Create a new advanced order
  static async create(orderData) {
    const {
      wallet_id,
      order_type,
      input_token_mint,
      input_token_symbol,
      input_amount,
      output_token_mint,
      output_token_symbol,
      trigger_price,
      limit_price,
      stop_loss_price,
      take_profit_price,
      condition_type,
      condition_value,
      condition_metadata,
      execute_at,
      expires_at,
      metadata
    } = orderData;

    const sql = `
      INSERT INTO advanced_orders (
        wallet_id, order_type, input_token_mint, input_token_symbol, input_amount,
        output_token_mint, output_token_symbol, trigger_price, limit_price,
        stop_loss_price, take_profit_price, condition_type, condition_value,
        condition_metadata, execute_at, expires_at, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      wallet_id, order_type, input_token_mint, input_token_symbol, input_amount,
      output_token_mint, output_token_symbol, trigger_price, limit_price,
      stop_loss_price, take_profit_price, condition_type, condition_value,
      condition_metadata, execute_at, expires_at, metadata
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Advanced order created: ${result.rows[0].order_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating advanced order:', error);
      throw error;
    }
  }

  // Get active orders for a wallet
  static async getActiveOrdersByWallet(wallet_id) {
    const sql = `
      SELECT * FROM advanced_orders
      WHERE wallet_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active orders:', error);
      throw error;
    }
  }

  // Check orders ready for execution
  static async getOrdersReadyForExecution() {
    const sql = `
      SELECT * FROM advanced_orders
      WHERE status = 'active'
      AND is_executed = false
      AND (
        execute_at <= CURRENT_TIMESTAMP OR
        (trigger_price IS NOT NULL AND (condition_type = 'price_above' OR condition_type = 'price_below'))
      )
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at ASC
    `;
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching orders ready for execution:', error);
      throw error;
    }
  }

  // Execute an order
  static async executeOrder(order_id, executed_price, tx_signature) {
    const sql = `
      UPDATE advanced_orders
      SET is_executed = true, executed_at = CURRENT_TIMESTAMP, executed_price = $1,
          execution_tx_signature = $2, status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $3
      RETURNING *
    `;
    try {
      const result = await query(sql, [executed_price, tx_signature, order_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error executing order:', error);
      throw error;
    }
  }

  // Cancel an order
  static async cancelOrder(order_id) {
    const sql = `
      UPDATE advanced_orders
      SET status = 'cancelled', is_executed = false, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
      RETURNING *
    `;
    try {
      const result = await query(sql, [order_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  static async getById(order_id) {
    const sql = 'SELECT * FROM advanced_orders WHERE order_id = $1';
    try {
      const result = await query(sql, [order_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching order:', error);
      throw error;
    }
  }
}

module.exports = AdvancedOrderModel;
