const LimitOrderModel = require('../models/limit-order.model');
const logger = require('../utils/logger');

class LimitOrderBookService {
  // Create a new limit order
  async createLimitOrder(walletId, orderData) {
    try {
      const order = await LimitOrderModel.create({
        wallet_id: walletId,
        ...orderData
      });
      logger.info(`Limit order created: ${order.order_id}`);
      return order;
    } catch (error) {
      logger.error('Error creating limit order:', error);
      throw error;
    }
  }

  // Cancel a limit order
  async cancelOrder(orderId, walletId) {
    try {
      const order = await LimitOrderModel.getById(orderId);
      if (!order || order.wallet_id !== walletId) {
        throw new Error('Order not found or unauthorized');
      }

      const cancelled = await LimitOrderModel.cancel(orderId);
      logger.info(`Limit order cancelled: ${orderId}`);
      return cancelled;
    } catch (error) {
      logger.error('Error cancelling limit order:', error);
      throw error;
    }
  }

  // Get open orders for wallet
  async getOpenOrders(walletId) {
    try {
      const orders = await LimitOrderModel.getOpenOrdersByWallet(walletId);
      return orders;
    } catch (error) {
      logger.error('Error fetching open orders:', error);
      throw error;
    }
  }

  // Get order book (aggregate all open orders for a token pair)
  async getOrderBook(inputMint, outputMint, depth = 20) {
    try {
      // Get buy orders (what people want to buy)
      const buyOrders = await LimitOrderModel.getOrderBookDepth(
        outputMint, inputMint, 'buy', depth
      );
      
      // Get sell orders (what people want to sell)
      const sellOrders = await LimitOrderModel.getOrderBookDepth(
        inputMint, outputMint, 'sell', depth
      );

      // Calculate bid-ask spread
      const spread = buyOrders.length > 0 && sellOrders.length > 0 
        ? sellOrders[0].limit_price - buyOrders[0].limit_price 
        : 0;

      return {
        bids: buyOrders.map(o => ({
          price: o.limit_price,
          quantity: o.remaining_amount,
          total: o.remaining_amount * o.limit_price
        })),
        asks: sellOrders.map(o => ({
          price: o.limit_price,
          quantity: o.remaining_amount,
          total: o.remaining_amount * o.limit_price
        })),
        spread: spread,
        spread_percent: spread > 0 ? (spread / ((buyOrders[0]?.limit_price + sellOrders[0]?.limit_price) / 2)) * 100 : 0
      };
    } catch (error) {
      logger.error('Error fetching order book:', error);
      throw error;
    }
  }

  // Execute matching (match buy and sell orders)
  async executeMatching(inputMint, outputMint) {
    try {
      const buyOrders = await LimitOrderModel.getOpenOrdersByTokenPair(outputMint, inputMint);
      const sellOrders = await LimitOrderModel.getOpenOrdersByTokenPair(inputMint, outputMint);

      const matches = [];

      for (const sellOrder of sellOrders) {
        for (const buyOrder of buyOrders) {
          // Check if prices cross
          if (buyOrder.limit_price >= sellOrder.limit_price) {
            const matchQuantity = Math.min(
              buyOrder.remaining_amount,
              sellOrder.remaining_amount
            );
            const matchPrice = sellOrder.created_at < buyOrder.created_at 
              ? sellOrder.limit_price 
              : buyOrder.limit_price;

            // Execute the match
            await LimitOrderModel.partialFill(
              buyOrder.order_id,
              matchQuantity,
              matchPrice,
              `match_${Date.now()}`
            );

            await LimitOrderModel.partialFill(
              sellOrder.order_id,
              matchQuantity,
              matchPrice,
              `match_${Date.now()}`
            );

            matches.push({
              buy_order_id: buyOrder.order_id,
              sell_order_id: sellOrder.order_id,
              quantity: matchQuantity,
              price: matchPrice
            });
          }
        }
      }

      if (matches.length > 0) {
        logger.info(`Executed ${matches.length} order matches`);
      }

      return matches;
    } catch (error) {
      logger.error('Error executing order matching:', error);
      throw error;
    }
  }

  // Get order details
  async getOrder(orderId, walletId) {
    try {
      const order = await LimitOrderModel.getById(orderId);
      if (!order || order.wallet_id !== walletId) {
        throw new Error('Order not found or unauthorized');
      }
      return order;
    } catch (error) {
      logger.error('Error fetching order:', error);
      throw error;
    }
  }
}

module.exports = new LimitOrderBookService();
