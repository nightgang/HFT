const AdvancedOrderModel = require('../models/advanced-order.model');
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
          // Get current market price (integrate with price feed service)
          const currentPrice = await this.getCurrentPrice(order.output_token_mint);
          
          // Check if order conditions are met
          if (this.checkOrderCondition(order, currentPrice)) {
            // Execute the order (integrate with trading engine)
            const executedOrder = await AdvancedOrderModel.executeOrder(
              order.order_id,
              currentPrice,
              null // tx_signature will be set by trading engine
            );
            results.push(executedOrder);
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
      case 'price_between':
        const range = JSON.parse(order.condition_metadata);
        return currentPrice >= range.min && currentPrice <= range.max;
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

  // Get order details
  async getOrder(orderId, walletId) {
    try {
      const order = await AdvancedOrderModel.getById(orderId);
      if (!order || order.wallet_id !== walletId) {
        throw new Error('Order not found or unauthorized');
      }
      return order;
    } catch (error) {
      logger.error('Error fetching order:', error);
      throw error;
    }
  }

  // Mock: Get current price (would integrate with actual price service)
  async getCurrentPrice(tokenMint) {
    // This would call a real price feed service
    return 150.5; // Mock price
  }
}

module.exports = new AdvancedOrderService();
