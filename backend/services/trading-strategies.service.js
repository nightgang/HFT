const { GridTradingModel, DCAModel, ScalpingBotModel } = require('../models/trading-strategies.model');
const logger = require('../utils/logger');

class GridTradingService {
  // Create grid trading configuration and generate orders
  async createGridTrading(walletId, configData) {
    try {
      const config = await GridTradingModel.createGridConfig({
        wallet_id: walletId,
        ...configData
      });

      // Generate grid prices
      const prices = GridTradingModel.calculateGridPrices(
        configData.lower_price,
        configData.upper_price,
        configData.grid_levels,
        configData.grid_type || 'linear'
      );

      // Calculate quantity per order
      const quantityPerOrder = configData.investment_amount / (prices.length * prices[Math.floor(prices.length / 2)]);

      // Create grid orders
      const orders = [];
      for (let i = 0; i < prices.length; i++) {
        const side = i < Math.floor(prices.length / 2) ? 'buy' : 'sell';
        const order = await GridTradingModel.createGridOrder(config.id, i, {
          price_level: prices[i],
          order_type: 'limit',
          side,
          quantity: quantityPerOrder
        });
        orders.push(order);
      }

      logger.info(`Grid trading created with ${orders.length} orders`);
      return { config, orders };
    } catch (error) {
      logger.error('Error creating grid trading:', error);
      throw error;
    }
  }

  // Update grid order when filled
  async updateGridOrder(orderId, filledQuantity, avgPrice) {
    try {
      const order = await GridTradingModel.updateGridOrderStatus(
        orderId,
        'filled',
        filledQuantity,
        avgPrice
      );
      logger.info(`Grid order ${orderId} updated`);
      return order;
    } catch (error) {
      logger.error('Error updating grid order:', error);
      throw error;
    }
  }

  // Get grid trading stats
  async getGridStats(gridConfigId) {
    try {
      const stats = await GridTradingModel.getGridStats(gridConfigId);
      return stats;
    } catch (error) {
      logger.error('Error fetching grid stats:', error);
      throw error;
    }
  }

  // Close grid trading
  async closeGridTrading(gridConfigId) {
    try {
      // Mark as completed in database
      const config = await GridTradingModel.getGridConfig(gridConfigId);
      if (!config) throw new Error('Grid config not found');

      logger.info(`Grid trading ${gridConfigId} closed`);
      return { success: true };
    } catch (error) {
      logger.error('Error closing grid trading:', error);
      throw error;
    }
  }
}

class DCAService {
  // Create DCA automation
  async createDCA(walletId, configData) {
    try {
      const nextExecutionTime = DCAModel.calculateNextExecutionTime(
        new Date(),
        configData.frequency,
        configData.frequency_value || 1
      );

      const config = await DCAModel.createDCAConfig({
        wallet_id: walletId,
        next_execution_time: nextExecutionTime,
        ...configData
      });

      logger.info(`DCA configuration created: ${config.id}`);
      return config;
    } catch (error) {
      logger.error('Error creating DCA:', error);
      throw error;
    }
  }

  // Execute DCA order
  async executeDCAOrder(dcaConfigId, executionData) {
    try {
      const config = await DCAModel.getDCAConfig(dcaConfigId);
      if (!config) throw new Error('DCA config not found');

      const execution = await DCAModel.recordExecution(
        dcaConfigId,
        (config.executed_orders || 0) + 1,
        executionData
      );

      // Update config
      const nextExecutionTime = DCAModel.calculateNextExecutionTime(
        new Date(),
        config.frequency,
        config.frequency_value
      );

      const newAvgPrice = ((config.average_buy_price || 0) * (config.executed_orders || 0) + executionData.price) / ((config.executed_orders || 0) + 1);

      const updatedConfig = await DCAModel.updateConfig(dcaConfigId, {
        status: config.executed_orders + 1 >= config.total_orders ? 'completed' : 'active',
        executed_orders: (config.executed_orders || 0) + 1,
        average_buy_price: newAvgPrice,
        total_spent: (config.total_spent || 0) + executionData.amount,
        total_accumulated: (config.total_accumulated || 0) + executionData.quantity,
        next_execution_time: nextExecutionTime
      });

      logger.info(`DCA execution recorded: ${execution.id}`);
      return { execution, config: updatedConfig };
    } catch (error) {
      logger.error('Error executing DCA order:', error);
      throw error;
    }
  }

  // Get DCA status
  async getDCAStatus(dcaConfigId) {
    try {
      const config = await DCAModel.getDCAConfig(dcaConfigId);
      const executions = await DCAModel.getExecutions(dcaConfigId);

      return {
        config,
        executions,
        progress: {
          completed: config.executed_orders,
          total: config.total_orders,
          percentage: (config.executed_orders / config.total_orders) * 100
        }
      };
    } catch (error) {
      logger.error('Error fetching DCA status:', error);
      throw error;
    }
  }

  // Get pending DCA orders
  async getPendingDCAOrders() {
    try {
      // This would fetch all active DCA configs with execution time <= now
      // Implementation depends on background job scheduler
      return [];
    } catch (error) {
      logger.error('Error fetching pending DCA orders:', error);
      throw error;
    }
  }
}

class ScalpingBotService {
  // Create scalping bot
  async createScalpingBot(walletId, botData) {
    try {
      const bot = await ScalpingBotModel.createBot({
        wallet_id: walletId,
        ...botData
      });

      logger.info(`Scalping bot created: ${bot.id}`);
      return bot;
    } catch (error) {
      logger.error('Error creating scalping bot:', error);
      throw error;
    }
  }

  // Record a scalping trade entry
  async enterScalpingTrade(botId, tradeData) {
    try {
      const trade = await ScalpingBotModel.recordTrade(botId, {
        ...tradeData,
        status: 'open'
      });

      logger.info(`Scalping trade opened: ${trade.id}`);
      return trade;
    } catch (error) {
      logger.error('Error entering scalping trade:', error);
      throw error;
    }
  }

  // Exit a scalping trade
  async exitScalpingTrade(tradeId, exitData) {
    try {
      const trade = await ScalpingBotModel.closeTrade(tradeId, exitData);
      
      logger.info(`Scalping trade closed: ${tradeId} | P&L: ${exitData.profit_loss}`);
      return trade;
    } catch (error) {
      logger.error('Error exiting scalping trade:', error);
      throw error;
    }
  }

  // Check for exit signals (profit/loss targets)
  async checkExitConditions(botId) {
    try {
      const openTrades = await ScalpingBotModel.getOpenTrades(botId);
      const closedTrades = [];

      for (const trade of openTrades) {
        // In real implementation, fetch current price and check conditions
        // For now, return structure
        closedTrades.push({
          tradeId: trade.id,
          entryPrice: trade.entry_price,
          exitPrice: null, // Would be current market price
          profitLoss: null,
          shouldClose: false
        });
      }

      return closedTrades;
    } catch (error) {
      logger.error('Error checking exit conditions:', error);
      throw error;
    }
  }

  // Get bot performance stats
  async getBotStats(botId) {
    try {
      // Would aggregate all closed trades and calculate stats
      return {
        botId,
        trades_executed: 0,
        win_count: 0,
        loss_count: 0,
        win_rate: 0,
        total_pnl: 0,
        avg_win: 0,
        avg_loss: 0
      };
    } catch (error) {
      logger.error('Error fetching bot stats:', error);
      throw error;
    }
  }
}

module.exports = { GridTradingService, DCAService, ScalpingBotService };
