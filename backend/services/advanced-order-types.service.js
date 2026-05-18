const AdvancedOrderModel = require('../models/advanced-order.model');
const jupiterService = require('../integrations/jupiter.service');
const tradingEngine = require('./engines/trading.engine');
const logger = require('../utils/logger');

/**
 * Service handling advanced order types such as limit, stop-loss, take-profit and conditional orders.
 * It builds on the existing AdvancedOrderModel and reuses utilities from the advanced-orders service.
 */
class AdvancedOrderTypesService {
  constructor() {
    // Define supported advanced order types
    this.supportedTypes = ['limit', 'stop-loss', 'take-profit', 'conditional'];
  }

  /**
   * Create a new advanced order.
   * @param {string} walletId - Owner wallet identifier.
   * @param {object} orderData - Order payload containing type and parameters.
   * @returns {Promise<object>} Created order record.
   */
  async createAdvancedOrder(walletId, orderData) {
    const { type, params } = orderData;
    if (!this.supportedTypes.includes(type)) {
      throw new Error(`Unsupported advanced order type: ${type}`);
    }
    // Merge type into params for storage
    const orderPayload = { ...params, order_type: type };
    const order = await AdvancedOrderModel.create({ wallet_id: walletId, ...orderPayload });
    logger.info(`Advanced order created (type=${type}): ${order.order_id}`);
    return order;
  }

  /**
   * Execute conditional orders whose conditions are satisfied.
   * This method scans pending orders, evaluates their condition and triggers execution.
   */
  async executeConditionalOrders() {
    const pending = await AdvancedOrderModel.getOrdersReadyForExecution();
    const executed = [];
    for (const order of pending) {
      if (order.order_type !== 'conditional') continue;
      const price = await this._getCurrentPrice(order.output_token_mint);
      if (this._checkCondition(order, price)) {
        const tradeResult = await this._executeTrade(order, price);
        const executedOrder = await AdvancedOrderModel.executeOrder(
          order.order_id,
          price,
          tradeResult.signature
        );
        executed.push({ order: executedOrder, trade: tradeResult });
      }
    }
    logger.info(`Executed ${executed.length} conditional orders`);
    return executed;
  }

  /**
   * Internal helper to evaluate an order's condition against the current price.
   */
  _checkCondition(order, currentPrice) {
    if (!order.condition_type) return true;
    switch (order.condition_type) {
      case 'price_above':
        return currentPrice >= order.condition_value;
      case 'price_below':
        return currentPrice <= order.condition_value;
      case 'price_between': {
        const range = JSON.parse(order.condition_metadata || '{}');
        return currentPrice >= range.min && currentPrice <= range.max;
      }
      case 'time_based':
        return new Date() >= new Date(order.execute_at || '1970-01-01');
      default:
        return true;
    }
  }

  /**
   * Internal helper to perform the actual trade via the trading engine.
   */
  async _executeTrade(order, _currentPrice) {
    const tradeRequest = {
      inputMint: order.input_token_mint,
      outputMint: order.output_token_mint,
      amount: order.input_amount,
      slippage: 0.5,
      walletId: order.wallet_id,
    };
    return tradingEngine.executeBuy(tradeRequest);
  }

  /**
   * Fetch current token price using the Jupiter integration.
   */
  async _getCurrentPrice(tokenMint) {
    const priceData = await jupiterService.getTokenPrice(tokenMint);
    return priceData.price;
  }
}

module.exports = new AdvancedOrderTypesService();