const { PositionCloneModel, OptionsFuturesModel } = require('../models/cloning-derivatives.model');
const logger = require('../utils/logger');

class PositionCloningService {
  // Create position clone configuration
  async createCloneConfig(walletId, configData) {
    try {
      const config = await PositionCloneModel.createCloneConfig({
        wallet_id: walletId,
        ...configData
      });

      logger.info(`Position cloning config created: ${config.id}`);
      return config;
    } catch (error) {
      logger.error('Error creating position clone config:', error);
      throw error;
    }
  }

  // Monitor source wallet and execute clones
  async monitorSourceWallet(cloneConfigId, sourcePositions) {
    try {
      const executions = [];

      for (const position of sourcePositions) {
        const execution = await this.clonePosition(cloneConfigId, position);
        if (execution) {
          executions.push(execution);
        }
      }

      return executions;
    } catch (error) {
      logger.error('Error monitoring source wallet:', error);
      throw error;
    }
  }

  // Clone a single position
  async clonePosition(cloneConfigId, sourcePosition) {
    try {
      // Get clone config to determine scaling
      // In production, fetch from DB
      
      const clonedQuantity = sourcePosition.quantity; // Would apply scale factor
      const clonedPrice = sourcePosition.entry_price; // Would get current market price

      const execution = await PositionCloneModel.recordExecution({
        clone_config_id: cloneConfigId,
        source_tx_hash: sourcePosition.tx_hash,
        source_entry_price: sourcePosition.entry_price,
        source_quantity: sourcePosition.quantity,
        cloned_quantity: clonedQuantity,
        cloned_price: clonedPrice,
        status: 'pending'
      });

      return execution;
    } catch (error) {
      logger.error('Error cloning position:', error);
      throw error;
    }
  }

  // Get clone statistics
  async getCloneStats(cloneConfigId) {
    try {
      return await PositionCloneModel.getConfigStats(cloneConfigId);
    } catch (error) {
      logger.error('Error fetching clone stats:', error);
      throw error;
    }
  }

  // Get clone execution history
  async getExecutionHistory(cloneConfigId) {
    try {
      return await PositionCloneModel.getExecutions(cloneConfigId);
    } catch (error) {
      logger.error('Error fetching clone execution history:', error);
      throw error;
    }
  }

  // Calculate scaled quantity
  calculateScaledQuantity(sourceQuantity, scaleMode, scaleFactor, maxValue) {
    let clonedQuantity = sourceQuantity;

    if (scaleMode === 'scaled') {
      clonedQuantity = sourceQuantity * scaleFactor;
    } else if (scaleMode === 'percentage') {
      clonedQuantity = sourceQuantity * (scaleFactor / 100);
    }

    // Cap at max copy value
    if (maxValue && clonedQuantity > maxValue) {
      clonedQuantity = maxValue;
    }

    return clonedQuantity;
  }
}

class OptionsFuturesService {
  // Create options/futures position
  async createPosition(walletId, positionData) {
    try {
      const position = await OptionsFuturesModel.createPosition({
        wallet_id: walletId,
        ...positionData
      });

      logger.info(`Options/Futures position created: ${position.id}`);
      return position;
    } catch (error) {
      logger.error('Error creating options/futures position:', error);
      throw error;
    }
  }

  // Create options/futures order
  async createOrder(walletId, orderData) {
    try {
      const order = await OptionsFuturesModel.createOrder({
        wallet_id: walletId,
        ...orderData
      });

      logger.info(`Options/Futures order created: ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Error creating options/futures order:', error);
      throw error;
    }
  }

  // Get active positions
  async getActivePositions(walletId) {
    try {
      return await OptionsFuturesModel.getActivePositions(walletId);
    } catch (error) {
      logger.error('Error fetching active positions:', error);
      throw error;
    }
  }

  // Update mark-to-market prices
  async updateMarkToMarket(positionId, currentPrice) {
    try {
      // Calculate current value and MTM P&L
      const position = await OptionsFuturesModel.getActivePositions(null); // Would fetch single position
      
      const currentValue = currentPrice * (position?.quantity || 0);
      const markToMarketPnL = currentValue - (position?.entry_price || 0) * (position?.quantity || 0);

      const updatedPosition = await OptionsFuturesModel.updateMTM(
        positionId,
        currentPrice,
        currentValue,
        markToMarketPnL
      );

      return updatedPosition;
    } catch (error) {
      logger.error('Error updating mark-to-market:', error);
      throw error;
    }
  }

  // Close position
  async closePosition(positionId) {
    try {
      const closed = await OptionsFuturesModel.closePosition(positionId);
      logger.info(`Options/Futures position closed: ${positionId}`);
      return closed;
    } catch (error) {
      logger.error('Error closing position:', error);
      throw error;
    }
  }

  // Get open orders
  async getOpenOrders(walletId) {
    try {
      return await OptionsFuturesModel.getOpenOrders(walletId);
    } catch (error) {
      logger.error('Error fetching open orders:', error);
      throw error;
    }
  }

  // Calculate Greeks (Delta, Gamma, Theta, Vega, Rho)
  calculateGreeks(optionType, spotPrice, strikePrice, timeToExpiry, volatility, riskFreeRate) {
    // Simplified Black-Scholes Greeks calculation
    const d1 = (Math.log(spotPrice / strikePrice) + (riskFreeRate + 0.5 * volatility ** 2) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    // Normal distribution approximation
    const N = (z) => 0.5 * (1 + Math.tanh(0.796 * z)); // Approximation
    const n = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);

    return {
      delta: optionType === 'call' ? N(d1) : N(d1) - 1,
      gamma: n(d1) / (spotPrice * volatility * Math.sqrt(timeToExpiry)),
      theta: optionType === 'call' 
        ? (-spotPrice * n(d1) * volatility / (2 * Math.sqrt(timeToExpiry)) - riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(d2)) / 365
        : (-spotPrice * n(d1) * volatility / (2 * Math.sqrt(timeToExpiry)) + riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2)) / 365,
      vega: spotPrice * n(d1) * Math.sqrt(timeToExpiry) / 100,
      rho: optionType === 'call'
        ? strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * N(d2) / 100
        : -strikePrice * timeToExpiry * Math.exp(-riskFreeRate * timeToExpiry) * N(-d2) / 100
    };
  }

  // Validate options/futures order parameters
  validateOrderParameters(orderData) {
    const errors = [];

    if (!orderData.quantity || orderData.quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (!orderData.price || orderData.price <= 0) {
      errors.push('Price must be positive');
    }

    if (orderData.leverage && (orderData.leverage < 1 || orderData.leverage > 125)) {
      errors.push('Leverage must be between 1 and 125');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = { PositionCloningService, OptionsFuturesService };
