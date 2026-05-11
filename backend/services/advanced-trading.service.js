const { ArbitrageModel, RebalancingModel, SLTPModel } = require('../models/advanced-trading.model');
const logger = require('../utils/logger');

class ArbitrageService {
  // Detect arbitrage opportunities (mock implementation)
  async detectOpportunities(walletId, tokenMints) {
    try {
      const opportunities = [];

      // In production, would integrate with multiple exchange APIs
      // For now, return empty or mock data
      logger.info(`Scanning ${tokenMints.length} tokens for arbitrage`);

      return opportunities;
    } catch (error) {
      logger.error('Error detecting arbitrage opportunities:', error);
      throw error;
    }
  }

  // Record detected opportunity
  async recordOpportunity(walletId, opportunityData) {
    try {
      const opportunity = await ArbitrageModel.recordOpportunity({
        wallet_id: walletId,
        ...opportunityData,
        expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });

      logger.info(`Arbitrage opportunity recorded: ${opportunity.id}`);
      return opportunity;
    } catch (error) {
      logger.error('Error recording arbitrage opportunity:', error);
      throw error;
    }
  }

  // Execute arbitrage trade
  async executeArbitrage(opportunityId, executionData) {
    try {
      await ArbitrageModel.updateOpportunityStatus(opportunityId, 'executing');

      const execution = await ArbitrageModel.recordExecution({
        opportunity_id: opportunityId,
        ...executionData
      });

      logger.info(`Arbitrage execution recorded: ${execution.id}`);
      return execution;
    } catch (error) {
      logger.error('Error executing arbitrage:', error);
      throw error;
    }
  }

  // Complete arbitrage trade
  async completeArbitrage(executionId, actualProfit, profitPercent) {
    try {
      const completed = await ArbitrageModel.completeExecution(executionId, actualProfit, profitPercent);
      logger.info(`Arbitrage completed with profit: ${actualProfit}`);
      return completed;
    } catch (error) {
      logger.error('Error completing arbitrage:', error);
      throw error;
    }
  }

  // Get active opportunities
  async getActiveOpportunities(walletId) {
    try {
      return await ArbitrageModel.getActiveOpportunities(walletId);
    } catch (error) {
      logger.error('Error fetching active opportunities:', error);
      throw error;
    }
  }
}

class RebalancingService {
  // Check if rebalancing needed
  async checkRebalancingNeeded(walletId, currentAllocations, targetAllocations) {
    try {
      const deviations = currentAllocations.map((current, i) => ({
        token: i,
        deviation: Math.abs(current - targetAllocations[i])
      }));

      const maxDeviation = Math.max(...deviations.map(d => d.deviation));

      return maxDeviation > 5; // 5% threshold
    } catch (error) {
      logger.error('Error checking rebalancing needed:', error);
      throw error;
    }
  }

  // Execute portfolio rebalancing
  async rebalancePortfolio(walletId, rebalancingData) {
    try {
      const event = await RebalancingModel.recordRebalancingEvent({
        wallet_id: walletId,
        ...rebalancingData
      });

      const allocations = [];
      for (const allocation of rebalancingData.allocations) {
        const recorded = await RebalancingModel.recordAllocation(event.id, allocation);
        allocations.push(recorded);
      }

      logger.info(`Portfolio rebalanced: ${event.id}`);
      return { event, allocations };
    } catch (error) {
      logger.error('Error rebalancing portfolio:', error);
      throw error;
    }
  }

  // Get rebalancing history
  async getRebalancingHistory(walletId) {
    try {
      return await RebalancingModel.getRebalancingHistory(walletId);
    } catch (error) {
      logger.error('Error fetching rebalancing history:', error);
      throw error;
    }
  }

  // Calculate rebalancing actions needed
  calculateRebalancingActions(currentAllocations, targetAllocations, portfolioValue) {
    const actions = [];

    for (let i = 0; i < currentAllocations.length; i++) {
      const current = currentAllocations[i];
      const target = targetAllocations[i];
      const difference = target - current;

      if (Math.abs(difference) > 0.5) {
        const action = difference > 0 ? 'buy' : 'sell';
        const amount = (Math.abs(difference) / 100) * portfolioValue;

        actions.push({
          token_index: i,
          action,
          amount,
          percentage_change: difference
        });
      }
    }

    return actions;
  }
}

class SLTPService {
  // Create stop loss and take profit orders
  async createSLTPOrders(walletId, slTPData) {
    try {
      const order = await SLTPModel.createSLTPOrder({
        wallet_id: walletId,
        ...slTPData
      });

      logger.info(`SL/TP order created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Error creating SL/TP order:', error);
      throw error;
    }
  }

  // Monitor positions for SL/TP triggers
  async checkTriggers(walletId, positions) {
    try {
      const activeOrders = await SLTPModel.getActiveOrders(walletId);
      const triggeredOrders = [];

      for (const order of activeOrders) {
        // Find corresponding position price
        const position = positions.find(p => p.token_mint === order.token_mint);
        if (!position) continue;

        const currentPrice = position.current_price;
        let triggered = false;
        let triggeredType = null;

        // Check stop loss
        if (order.stop_loss_price && currentPrice <= order.stop_loss_price) {
          triggered = true;
          triggeredType = 'stop_loss';
        }

        // Check take profit
        if (order.take_profit_price && currentPrice >= order.take_profit_price) {
          triggered = true;
          triggeredType = 'take_profit';
        }

        if (triggered) {
          const pnl = (currentPrice - order.entry_price) * order.quantity;
          const triggered_order = await SLTPModel.triggerOrder(order.id, triggeredType, currentPrice, pnl);
          triggeredOrders.push(triggered_order);
        }
      }

      return triggeredOrders;
    } catch (error) {
      logger.error('Error checking SL/TP triggers:', error);
      throw error;
    }
  }

  // Get active SL/TP orders
  async getActiveOrders(walletId) {
    try {
      return await SLTPModel.getActiveOrders(walletId);
    } catch (error) {
      logger.error('Error fetching active SL/TP orders:', error);
      throw error;
    }
  }
}

module.exports = { ArbitrageService, RebalancingService, SLTPService };
