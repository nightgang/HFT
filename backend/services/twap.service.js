const logger = require('../utils/logger');
const tradingEngine = require('./engines/trading.engine');
const cacheService = require('./cache.service');

class TWAPService {
  constructor() {
    this.activeOrders = new Map(); // orderId -> order data
    this.minInterval = 30 * 1000; // 30 seconds minimum between executions
    this.maxInterval = 300 * 1000; // 5 minutes maximum between executions
    this.defaultDuration = 60 * 60 * 1000; // 1 hour default duration
  }

  /**
   * Create a TWAP order
   * @param {Object} orderParams - Order parameters
   * @returns {Promise<Object>} TWAP order details
   */
  async createTWAPOrder(orderParams) {
    try {
      const {
        walletId,
        tokenMint,
        side, // 'BUY' or 'SELL'
        totalAmount,
        duration = this.defaultDuration,
        maxIntervals = 20,
        priceLimit, // Optional price limit
        slippageBps = 50
      } = orderParams;

      logger.info(`⏰ Creating TWAP order: ${side} ${totalAmount} of ${tokenMint} over ${duration}ms`);

      // Validate parameters
      if (!['BUY', 'SELL'].includes(side)) {
        throw new Error('Invalid side. Must be BUY or SELL');
      }

      if (totalAmount <= 0) {
        throw new Error('Total amount must be positive');
      }

      // Calculate execution intervals
      const numIntervals = Math.min(maxIntervals, Math.floor(duration / this.minInterval));
      const intervalDuration = Math.max(this.minInterval, duration / numIntervals);
      const amountPerInterval = totalAmount / numIntervals;

      const orderId = `twap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const twapOrder = {
        orderId,
        walletId,
        tokenMint,
        side,
        totalAmount,
        remainingAmount: totalAmount,
        amountPerInterval,
        numIntervals,
        executedIntervals: 0,
        duration,
        intervalDuration,
        startTime: Date.now(),
        endTime: Date.now() + duration,
        priceLimit,
        slippageBps,
        status: 'ACTIVE',
        executions: [],
        averagePrice: 0,
        totalExecuted: 0,
        createdAt: Date.now()
      };

      // Store order
      this.activeOrders.set(orderId, twapOrder);

      // Cache order details
      const cacheKey = `twap_order:${orderId}`;
      await cacheService.set(cacheKey, twapOrder, Math.ceil(duration / 1000) + 3600); // Cache until end + 1 hour

      // Schedule first execution
      this.scheduleNextExecution(orderId);

      logger.info(`⏰ TWAP order created: ${orderId} - ${numIntervals} intervals of ${amountPerInterval} every ${intervalDuration}ms`);

      return {
        success: true,
        orderId,
        order: twapOrder
      };

    } catch (error) {
      logger.error('Error creating TWAP order:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel a TWAP order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelTWAPOrder(orderId) {
    try {
      const order = this.activeOrders.get(orderId);
      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'ACTIVE') {
        return { success: false, error: `Order is ${order.status}` };
      }

      // Update order status
      order.status = 'CANCELLED';
      order.cancelledAt = Date.now();

      // Remove from active orders
      this.activeOrders.delete(orderId);

      // Update cache
      const cacheKey = `twap_order:${orderId}`;
      await cacheService.set(cacheKey, order, 3600); // Keep cancelled order for 1 hour

      logger.info(`⏰ TWAP order cancelled: ${orderId}`);

      return {
        success: true,
        orderId,
        order
      };

    } catch (error) {
      logger.error(`Error cancelling TWAP order ${orderId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get TWAP order status
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order status
   */
  async getTWAPOrderStatus(orderId) {
    try {
      // Try active orders first
      let order = this.activeOrders.get(orderId);

      // If not found, try cache
      if (!order) {
        const cacheKey = `twap_order:${orderId}`;
        order = await cacheService.get(cacheKey);
      }

      if (!order) {
        return { success: false, error: 'Order not found' };
      }

      // Calculate progress
      const progress = order.totalAmount > 0 ? (order.totalExecuted / order.totalAmount) * 100 : 0;
      const timeElapsed = Date.now() - order.startTime;
      const timeProgress = (timeElapsed / order.duration) * 100;

      return {
        success: true,
        orderId,
        status: order.status,
        progress: Math.round(progress * 100) / 100,
        timeProgress: Math.round(timeProgress * 100) / 100,
        executedIntervals: order.executedIntervals,
        totalIntervals: order.numIntervals,
        remainingAmount: Math.round((order.totalAmount - order.totalExecuted) * 100) / 100,
        averagePrice: order.averagePrice > 0 ? Math.round(order.averagePrice * 100) / 100 : 0,
        executions: order.executions,
        nextExecution: order.nextExecutionTime ? new Date(order.nextExecutionTime).toISOString() : null
      };

    } catch (error) {
      logger.error(`Error getting TWAP order status ${orderId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule next execution for TWAP order
   * @param {string} orderId - Order ID
   */
  scheduleNextExecution(orderId) {
    const order = this.activeOrders.get(orderId);
    if (!order || order.status !== 'ACTIVE') {
      return;
    }

    const now = Date.now();
    const nextExecutionTime = now + order.intervalDuration;

    // Check if order should still be active
    if (nextExecutionTime > order.endTime || order.remainingAmount <= 0) {
      this.completeTWAPOrder(orderId);
      return;
    }

    order.nextExecutionTime = nextExecutionTime;

    // Schedule execution
    setTimeout(() => {
      this.executeTWAPInterval(orderId);
    }, order.intervalDuration);

    logger.debug(`⏰ Next TWAP execution scheduled for ${orderId} at ${new Date(nextExecutionTime).toISOString()}`);
  }

  /**
   * Execute one interval of TWAP order
   * @param {string} orderId - Order ID
   */
  async executeTWAPInterval(orderId) {
    try {
      const order = this.activeOrders.get(orderId);
      if (!order || order.status !== 'ACTIVE') {
        return;
      }

      const now = Date.now();

      // Check if order has expired
      if (now > order.endTime) {
        this.completeTWAPOrder(orderId);
        return;
      }

      // Calculate amount to execute
      const amountToExecute = Math.min(order.amountPerInterval, order.remainingAmount);

      if (amountToExecute <= 0) {
        this.completeTWAPOrder(orderId);
        return;
      }

      logger.info(`⏰ Executing TWAP interval: ${orderId} - ${order.side} ${amountToExecute} of ${order.tokenMint}`);

      // Execute the trade
      const executionResult = await this.executeTWAPTrade(order, amountToExecute);

      // Update order state
      order.executedIntervals++;
      order.totalExecuted += executionResult.executedAmount;
      order.remainingAmount -= executionResult.executedAmount;
      order.executions.push({
        timestamp: now,
        amount: executionResult.executedAmount,
        price: executionResult.price,
        txSignature: executionResult.txSignature,
        success: executionResult.success
      });

      // Update average price
      if (executionResult.success && executionResult.price > 0) {
        const totalValue = order.executions.reduce((sum, exec) => sum + (exec.amount * exec.price), 0);
        order.averagePrice = totalValue / order.totalExecuted;
      }

      // Update cache
      const cacheKey = `twap_order:${orderId}`;
      await cacheService.set(cacheKey, order, Math.ceil((order.endTime - now) / 1000) + 3600);

      // Check if order is complete
      if (order.remainingAmount <= 0 || order.executedIntervals >= order.numIntervals) {
        this.completeTWAPOrder(orderId);
      } else {
        // Schedule next execution
        this.scheduleNextExecution(orderId);
      }

      logger.info(`✅ TWAP interval executed: ${orderId} - ${executionResult.executedAmount} executed at $${executionResult.price}`);

    } catch (error) {
      logger.error(`Error executing TWAP interval for ${orderId}:`, error);

      // Mark execution as failed
      const order = this.activeOrders.get(orderId);
      if (order) {
        order.executions.push({
          timestamp: Date.now(),
          amount: 0,
          price: 0,
          success: false,
          error: error.message
        });

        // Continue with next interval despite failure
        this.scheduleNextExecution(orderId);
      }
    }
  }

  /**
   * Execute a single TWAP trade
   * @param {Object} order - TWAP order
   * @param {number} amount - Amount to execute
   * @returns {Promise<Object>} Execution result
   */
  async executeTWAPTrade(order, amount) {
    try {
      // In a real implementation, this would call the trading engine
      // For now, simulate execution
      const mockPrice = order.tokenMint.includes('SOL') ? 150 + (Math.random() - 0.5) * 10 : 1;
      const slippage = (Math.random() * order.slippageBps) / 10000; // Random slippage
      const executedAmount = amount * (1 - slippage);

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        success: true,
        executedAmount: Math.round(executedAmount * 100) / 100,
        price: Math.round(mockPrice * 100) / 100,
        txSignature: `twap_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };

    } catch (error) {
      logger.error('Error executing TWAP trade:', error);
      return {
        success: false,
        executedAmount: 0,
        price: 0,
        error: error.message
      };
    }
  }

  /**
   * Complete a TWAP order
   * @param {string} orderId - Order ID
   */
  completeTWAPOrder(orderId) {
    const order = this.activeOrders.get(orderId);
    if (!order) {
      return;
    }

    order.status = 'COMPLETED';
    order.completedAt = Date.now();

    // Remove from active orders
    this.activeOrders.delete(orderId);

    // Update cache
    const cacheKey = `twap_order:${orderId}`;
    cacheService.set(cacheKey, order, 86400); // Keep completed orders for 24 hours

    logger.info(`🎉 TWAP order completed: ${orderId} - ${order.totalExecuted}/${order.totalAmount} executed`);
  }

  /**
   * Get all active TWAP orders
   * @returns {Array} Array of active orders
   */
  getActiveOrders() {
    return Array.from(this.activeOrders.values()).map(order => ({
      orderId: order.orderId,
      walletId: order.walletId,
      tokenMint: order.tokenMint,
      side: order.side,
      progress: Math.round((order.totalExecuted / order.totalAmount) * 10000) / 100,
      remainingAmount: order.remainingAmount,
      averagePrice: order.averagePrice,
      nextExecution: order.nextExecutionTime
    }));
  }

  /**
   * Clean up expired orders
   */
  cleanupExpiredOrders() {
    const now = Date.now();

    for (const [orderId, order] of this.activeOrders) {
      if (now > order.endTime && order.status === 'ACTIVE') {
        logger.warn(`Cleaning up expired TWAP order: ${orderId}`);
        this.completeTWAPOrder(orderId);
      }
    }
  }
}

module.exports = new TWAPService();