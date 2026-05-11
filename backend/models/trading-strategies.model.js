const { query } = require('../db/connection');
const logger = require('../utils/logger');

class GridTradingModel {
  // Create a grid trading configuration
  static async createGridConfig(configData) {
    const {
      wallet_id,
      name,
      token_mint,
      base_token_mint,
      grid_levels,
      grid_type,
      lower_price,
      upper_price,
      investment_amount,
      take_profit_price,
      stop_loss_price,
      auto_refill,
      refill_threshold
    } = configData;

    const sql = `
      INSERT INTO grid_trading_configs (
        wallet_id, name, token_mint, base_token_mint, grid_levels, grid_type,
        lower_price, upper_price, investment_amount, take_profit_price, stop_loss_price,
        auto_refill, refill_threshold
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    try {
      const values = [
        wallet_id, name, token_mint, base_token_mint, grid_levels, grid_type,
        lower_price, upper_price, investment_amount, take_profit_price, stop_loss_price,
        auto_refill, refill_threshold
      ];
      const result = await query(sql, values);
      logger.info(`Grid trading config created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating grid trading config:', error);
      throw error;
    }
  }

  // Get grid trading config
  static async getGridConfig(configId) {
    const sql = `SELECT * FROM grid_trading_configs WHERE id = $1`;
    try {
      const result = await query(sql, [configId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching grid config:', error);
      throw error;
    }
  }

  // Get all active grid configs for a wallet
  static async getActiveConfigs(walletId) {
    const sql = `
      SELECT * FROM grid_trading_configs
      WHERE wallet_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [walletId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active grid configs:', error);
      throw error;
    }
  }

  // Create grid orders
  static async createGridOrder(gridConfigId, orderIndex, orderData) {
    const {
      price_level,
      order_type,
      side,
      quantity
    } = orderData;

    const sql = `
      INSERT INTO grid_orders (grid_config_id, order_index, price_level, order_type, side, quantity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    try {
      const result = await query(sql, [gridConfigId, orderIndex, price_level, order_type, side, quantity]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating grid order:', error);
      throw error;
    }
  }

  // Get grid orders for a config
  static async getGridOrders(gridConfigId) {
    const sql = `
      SELECT * FROM grid_orders
      WHERE grid_config_id = $1
      ORDER BY order_index ASC
    `;
    try {
      const result = await query(sql, [gridConfigId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching grid orders:', error);
      throw error;
    }
  }

  // Update grid order status
  static async updateGridOrderStatus(orderId, status, filledQuantity, averageFillPrice) {
    const sql = `
      UPDATE grid_orders
      SET status = $2, filled_quantity = $3, average_fill_price = $4, filled_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [orderId, status, filledQuantity, averageFillPrice]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating grid order status:', error);
      throw error;
    }
  }

  // Calculate grid prices (linear or geometric)
  static calculateGridPrices(lowerPrice, upperPrice, levels, gridType = 'linear') {
    const prices = [];

    if (gridType === 'linear') {
      const step = (upperPrice - lowerPrice) / (levels - 1);
      for (let i = 0; i < levels; i++) {
        prices.push(lowerPrice + (step * i));
      }
    } else if (gridType === 'geometric') {
      const ratio = Math.pow(upperPrice / lowerPrice, 1 / (levels - 1));
      for (let i = 0; i < levels; i++) {
        prices.push(lowerPrice * Math.pow(ratio, i));
      }
    }

    return prices;
  }

  // Get grid trading stats
  static async getGridStats(gridConfigId) {
    const sql = `
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'filled' THEN 1 ELSE 0 END) as filled_orders,
        SUM(filled_quantity * average_fill_price) as total_filled_value,
        AVG(average_fill_price) as avg_fill_price,
        SUM(profit_loss) as total_pnl
      FROM grid_orders
      WHERE grid_config_id = $1
    `;

    try {
      const result = await query(sql, [gridConfigId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching grid stats:', error);
      throw error;
    }
  }
}

class DCAModel {
  // Create DCA configuration
  static async createDCAConfig(configData) {
    const {
      wallet_id,
      name,
      token_mint,
      base_token_mint,
      investment_amount,
      frequency,
      frequency_value,
      total_orders,
      next_execution_time
    } = configData;

    const sql = `
      INSERT INTO dca_configurations (
        wallet_id, name, token_mint, base_token_mint, investment_amount,
        frequency, frequency_value, total_orders, next_execution_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_id, name, token_mint, base_token_mint, investment_amount,
        frequency, frequency_value, total_orders, next_execution_time
      ]);
      logger.info(`DCA config created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating DCA config:', error);
      throw error;
    }
  }

  // Get DCA config
  static async getDCAConfig(configId) {
    const sql = `SELECT * FROM dca_configurations WHERE id = $1`;
    try {
      const result = await query(sql, [configId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching DCA config:', error);
      throw error;
    }
  }

  // Get all active DCA configs
  static async getActiveConfigs(walletId) {
    const sql = `
      SELECT * FROM dca_configurations
      WHERE wallet_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [walletId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching active DCA configs:', error);
      throw error;
    }
  }

  // Record DCA execution
  static async recordExecution(dcaConfigId, executionNumber, executionData) {
    const { amount, price, quantity, tx_hash, status } = executionData;

    const sql = `
      INSERT INTO dca_executions (dca_config_id, execution_number, amount, price, quantity, on_chain_tx_hash, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await query(sql, [dcaConfigId, executionNumber, amount, price, quantity, tx_hash, status]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording DCA execution:', error);
      throw error;
    }
  }

  // Get DCA executions
  static async getExecutions(dcaConfigId) {
    const sql = `
      SELECT * FROM dca_executions
      WHERE dca_config_id = $1
      ORDER BY execution_number ASC
    `;
    try {
      const result = await query(sql, [dcaConfigId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching DCA executions:', error);
      throw error;
    }
  }

  // Update DCA config
  static async updateConfig(configId, updateData) {
    const { status, executed_orders, average_buy_price, total_spent, total_accumulated, next_execution_time } = updateData;

    const sql = `
      UPDATE dca_configurations
      SET status = $2, executed_orders = $3, average_buy_price = $4, total_spent = $5,
          total_accumulated = $6, next_execution_time = $7
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [configId, status, executed_orders, average_buy_price, total_spent, total_accumulated, next_execution_time]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating DCA config:', error);
      throw error;
    }
  }

  // Calculate next execution time based on frequency
  static calculateNextExecutionTime(currentTime, frequency, frequencyValue) {
    const nextTime = new Date(currentTime);

    switch (frequency) {
      case 'hourly':
        nextTime.setHours(nextTime.getHours() + frequencyValue);
        break;
      case 'daily':
        nextTime.setDate(nextTime.getDate() + frequencyValue);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + (7 * frequencyValue));
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + frequencyValue);
        break;
    }

    return nextTime;
  }
}

class ScalpingBotModel {
  // Create scalping bot
  static async createBot(botData) {
    const {
      wallet_id,
      name,
      token_mint,
      base_token_mint,
      entry_point,
      exit_profit_percent,
      exit_loss_percent,
      position_size,
      max_positions,
      check_interval
    } = botData;

    const sql = `
      INSERT INTO scalping_bots (
        wallet_id, name, token_mint, base_token_mint, entry_point,
        exit_profit_percent, exit_loss_percent, position_size, max_positions, check_interval
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    try {
      const result = await query(sql, [
        wallet_id, name, token_mint, base_token_mint, entry_point,
        exit_profit_percent, exit_loss_percent, position_size, max_positions, check_interval
      ]);
      logger.info(`Scalping bot created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating scalping bot:', error);
      throw error;
    }
  }

  // Record scalping trade
  static async recordTrade(botId, tradeData) {
    const { entry_price, quantity, status } = tradeData;

    const sql = `
      INSERT INTO scalping_trades (bot_id, entry_price, quantity, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    try {
      const result = await query(sql, [botId, entry_price, quantity, status]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording scalping trade:', error);
      throw error;
    }
  }

  // Update trade with exit info
  static async closeTrade(tradeId, exitData) {
    const { exit_price, profit_loss, profit_loss_percent, exit_reason, exit_tx_hash } = exitData;

    const sql = `
      UPDATE scalping_trades
      SET exit_price = $2, profit_loss = $3, profit_loss_percent = $4,
          exit_reason = $5, exit_tx_hash = $6, status = 'closed', exit_time = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await query(sql, [tradeId, exit_price, profit_loss, profit_loss_percent, exit_reason, exit_tx_hash]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error closing scalping trade:', error);
      throw error;
    }
  }

  // Get open trades for bot
  static async getOpenTrades(botId) {
    const sql = `
      SELECT * FROM scalping_trades
      WHERE bot_id = $1 AND status = 'open'
      ORDER BY entry_time ASC
    `;

    try {
      const result = await query(sql, [botId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching open trades:', error);
      throw error;
    }
  }
}

module.exports = { GridTradingModel, DCAModel, ScalpingBotModel };
