const { query } = require('../db/connection');
const logger = require('../utils/logger');

class ArbitrageModel {
  // Record arbitrage opportunity
  static async recordOpportunity(opportunityData) {
    const {
      wallet_id,
      token_mint,
      exchange_a,
      exchange_b,
      price_a,
      price_b,
      price_difference_percent,
      profit_potential,
      volume_available,
      confidence_score,
      expires_at
    } = opportunityData;

    const sql = `
      INSERT INTO arbitrage_opportunities (
        wallet_id, token_mint, exchange_a, exchange_b, price_a, price_b,
        price_difference_percent, profit_potential, volume_available,
        confidence_score, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_id, token_mint, exchange_a, exchange_b, price_a, price_b,
        price_difference_percent, profit_potential, volume_available,
        confidence_score, expires_at
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording arbitrage opportunity:', error);
      throw error;
    }
  }

  // Get active opportunities
  static async getActiveOpportunities(walletId) {
    const sql = `
      SELECT * FROM arbitrage_opportunities
      WHERE wallet_id = $1 AND status = 'pending'
      AND expires_at > CURRENT_TIMESTAMP
      ORDER BY profit_potential DESC
    `;

    try {
      const result = await query(sql, [walletId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active opportunities:', error);
      throw error;
    }
  }

  // Update opportunity status
  static async updateOpportunityStatus(opportunityId, status) {
    const sql = `
      UPDATE arbitrage_opportunities
      SET status = $2
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [opportunityId, status]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating opportunity status:', error);
      throw error;
    }
  }

  // Record arbitrage execution
  static async recordExecution(executionData) {
    const {
      opportunity_id,
      buy_exchange,
      sell_exchange,
      buy_price,
      sell_price,
      quantity,
      buy_tx_hash,
      sell_tx_hash,
      bridge_tx_hash
    } = executionData;

    const sql = `
      INSERT INTO arbitrage_executions (
        opportunity_id, buy_exchange, sell_exchange, buy_price, sell_price,
        quantity, buy_tx_hash, sell_tx_hash, bridge_tx_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        opportunity_id, buy_exchange, sell_exchange, buy_price, sell_price,
        quantity, buy_tx_hash, sell_tx_hash, bridge_tx_hash
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording arbitrage execution:', error);
      throw error;
    }
  }

  // Complete arbitrage execution
  static async completeExecution(executionId, actualProfit, profitPercent) {
    const sql = `
      UPDATE arbitrage_executions
      SET status = 'completed', actual_profit = $2, profit_percent = $3, completed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [executionId, actualProfit, profitPercent]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error completing arbitrage execution:', error);
      throw error;
    }
  }
}

class RebalancingModel {
  // Record rebalancing event
  static async recordRebalancingEvent(eventData) {
    const {
      wallet_id,
      rebalancing_type,
      target_allocation_percent,
      threshold_deviation,
      total_value
    } = eventData;

    const sql = `
      INSERT INTO rebalancing_events (
        wallet_id, rebalancing_type, target_allocation_percent,
        threshold_deviation, total_value
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_id, rebalancing_type, target_allocation_percent,
        threshold_deviation, total_value
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording rebalancing event:', error);
      throw error;
    }
  }

  // Record rebalancing allocation
  static async recordAllocation(rebalancingEventId, allocationData) {
    const {
      token_mint,
      previous_allocation,
      target_allocation,
      previous_value,
      target_value,
      transaction_hash
    } = allocationData;

    const sql = `
      INSERT INTO rebalancing_allocations (
        rebalancing_event_id, token_mint, previous_allocation, target_allocation,
        previous_value, target_value, transaction_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        rebalancingEventId, token_mint, previous_allocation, target_allocation,
        previous_value, target_value, transaction_hash
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording rebalancing allocation:', error);
      throw error;
    }
  }

  // Get rebalancing history
  static async getRebalancingHistory(walletId, limit = 10) {
    const sql = `
      SELECT * FROM rebalancing_events
      WHERE wallet_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    try {
      const result = await query(sql, [walletId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching rebalancing history:', error);
      throw error;
    }
  }
}

class SLTPModel {
  // Create stop loss/take profit order
  static async createSLTPOrder(slTPData) {
    const {
      wallet_id,
      token_mint,
      entry_price,
      quantity,
      stop_loss_price,
      stop_loss_percent,
      take_profit_price,
      take_profit_percent,
      take_profit_levels
    } = slTPData;

    const sql = `
      INSERT INTO stop_loss_take_profit_orders (
        wallet_id, token_mint, entry_price, quantity,
        stop_loss_price, stop_loss_percent,
        take_profit_price, take_profit_percent,
        take_profit_levels
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_id, token_mint, entry_price, quantity,
        stop_loss_price, stop_loss_percent,
        take_profit_price, take_profit_percent,
        take_profit_levels
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating SL/TP order:', error);
      throw error;
    }
  }

  // Get active SL/TP orders
  static async getActiveOrders(walletId) {
    const sql = `
      SELECT * FROM stop_loss_take_profit_orders
      WHERE wallet_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `;

    try {
      const result = await query(sql, [walletId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active SL/TP orders:', error);
      throw error;
    }
  }

  // Trigger SL/TP order
  static async triggerOrder(orderId, triggeredType, triggeredPrice, pnl) {
    const sql = `
      UPDATE stop_loss_take_profit_orders
      SET status = 'triggered', triggered_type = $2, triggered_price = $3,
          total_pnl = $4, triggered_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [orderId, triggeredType, triggeredPrice, pnl]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error triggering SL/TP order:', error);
      throw error;
    }
  }
}

module.exports = { ArbitrageModel, RebalancingModel, SLTPModel };
