const AdvancedOrderModel = require('../models/advanced-order.model');
const jupiterService = require('../integrations/jupiter.service');
const tradingEngine = require('./engines/trading.engine');
const logger = require('../utils/logger');

class AdvancedOrderService {
  // Create a new advanced order
  async createAdvancedOrder(walletId, orderData) {
    try {
      const order = await AdvancedOrderModel.create({
        wallet_id: walletId,
        ...orderData
      });
      logger.info(`Advanced order created: ${order.order_id}`);
      return order;
    } catch (error) {
      logger.error('Error creating advanced order:', error);
      throw error;
    }
  }

  // Execute pending orders based on conditions
  async executePendingOrders() {
    try {
      const readyOrders = await AdvancedOrderModel.getOrdersReadyForExecution();
      
      const results = [];
      for (const order of readyOrders) {
        try {
          // Get current market price
          const currentPrice = await this.getCurrentPrice(order.output_token_mint);
          
          // Check if order conditions are met
          if (this.checkOrderCondition(order, currentPrice)) {
            // Execute the trade using trading engine
            const tradeResult = await this.executeOrderTrade(order, currentPrice);
            
            // Update order status
            const executedOrder = await AdvancedOrderModel.executeOrder(
              order.order_id,
              currentPrice,
              tradeResult.txSignature || tradeResult.signature
            );
            results.push({ order: executedOrder, trade: tradeResult });
          }
        } catch (error) {
          logger.error(`Error executing order ${order.order_id}:`, error);
        }
      }
      
      logger.info(`Executed ${results.length} pending orders`);
      return results;
    } catch (error) {
      logger.error('Error executing pending orders:', error);
      throw error;
    }
  }

  // Check if order condition is met
  checkOrderCondition(order, currentPrice) {
    if (!order.condition_type) return true;
    
    switch (order.condition_type) {
      case 'price_above':
        return currentPrice >= order.condition_value;
      case 'price_below':
        return currentPrice <= order.condition_value;
      case 'price_between': {
        const range = JSON.parse(order.condition_metadata);
        return currentPrice >= range.min && currentPrice <= range.max;
      }
      case 'volatility_above':
        // Would integrate with volatility calculation service
        return true;
      case 'time_based':
        return new Date() >= new Date(order.execute_at);
      default:
        return true;
    }
  }

  // Cancel an order
  async cancelOrder(orderId, walletId) {
    try {
      const order = await AdvancedOrderModel.getById(orderId);
      if (!order || order.wallet_id !== walletId) {
        throw new Error('Order not found or unauthorized');
      }
      
      const cancelled = await AdvancedOrderModel.cancelOrder(orderId);
      logger.info(`Order cancelled: ${orderId}`);
      return cancelled;
    } catch (error) {
      logger.error('Error cancelling order:', error);
      throw error;
    }
  }

  // Get active orders for wallet
  async getActiveOrders(walletId) {
    try {
      const orders = await AdvancedOrderModel.getActiveOrdersByWallet(walletId);
      return orders;
    } catch (error) {
      logger.error('Error fetching active orders:', error);
      throw error;
    }
  }

  // Execute the actual trade for an order
  async executeOrderTrade(order, _currentPrice) {
    try {
      // Determine trade direction based on order type
      // For now, assume it's a buy order (input -> output)
      const tradeRequest = {
        inputMint: order.input_token_mint,
        outputMint: order.output_token_mint,
        amount: order.input_amount,
        slippage: 0.5, // 0.5% default slippage
        walletId: order.wallet_id
      };

      // Use trading engine to execute buy
      const result = await tradingEngine.executeBuy(tradeRequest);
      return result;
    } catch (error) {
      logger.error(`Error executing trade for order ${order.order_id}:`, error);
      throw error;
    }
  }

  // Get current price for a token
  async getCurrentPrice(tokenMint) {
    try {
      const priceData = await jupiterService.getTokenPrice(tokenMint);
      return priceData.price;
    } catch (error) {
      logger.error(`Error getting current price for ${tokenMint}:`, error);
      // Return a fallback price or throw
      throw new Error(`Unable to get current price for token ${tokenMint}`);
    }
  }
}

module.exports = new AdvancedOrderService();
