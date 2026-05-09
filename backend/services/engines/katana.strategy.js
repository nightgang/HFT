/**
 * Katana Strategy Engine
 *
 * Manages trading strategies including take profit levels, trailing stops,
 * stop losses, and position monitoring for Katana Mode.
 *
 * Features:
 * - Configurable TP system (TP1: 200%, TP2: 400%, TP3: 600%)
 * - Trailing stop loss
 * - Breakeven stop
 * - Real-time position monitoring
 * - Profit/loss tracking
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');
const jupiterService = require('../integrations/jupiter.service');

class KatanaStrategy extends EventEmitter {
  constructor() {
    super();
    this.positions = new Map();
    this.config = {
      tp1: {
        profitPercent: parseFloat(process.env.KATANA_TP1_PROFIT) || 200,
        sellPercent: parseFloat(process.env.KATANA_TP1_SELL) || 30
      },
      tp2: {
        profitPercent: parseFloat(process.env.KATANA_TP2_PROFIT) || 400,
        sellPercent: parseFloat(process.env.KATANA_TP2_SELL) || 30
      },
      tp3: {
        profitPercent: parseFloat(process.env.KATANA_TP3_PROFIT) || 600,
        sellPercent: parseFloat(process.env.KATANA_TP3_SELL) || 100 // Remaining balance
      },
      trailingStop: {
        enabled: process.env.KATANA_TRAILING_STOP_ENABLED === 'true',
        percent: parseFloat(process.env.KATANA_TRAILING_STOP_PERCENT) || 10
      },
      stopLoss: {
        enabled: process.env.KATANA_STOP_LOSS_ENABLED === 'true',
        percent: parseFloat(process.env.KATANA_STOP_LOSS_PERCENT) || 20
      },
      breakevenStop: {
        enabled: process.env.KATANA_BREAKEVEN_ENABLED === 'true',
        profitPercent: parseFloat(process.env.KATANA_BREAKEVEN_PROFIT) || 50
      }
    };

    this.monitoringInterval = null;
  }

  async initialize() {
    logger.info('🎯 Initializing Katana Strategy Engine');
    this.startPositionMonitoring();
  }

  async shutdown() {
    logger.info('🛑 Shutting down Katana Strategy Engine');
    this.stopPositionMonitoring();
  }

  createPosition(tradeData) {
    const position = {
      id: tradeData.id,
      tokenMint: tradeData.tokenMint,
      entryPrice: tradeData.price,
      amount: tradeData.amount,
      wallet: tradeData.wallet,
      timestamp: Date.now(),
      currentPrice: tradeData.price,
      highestPrice: tradeData.price,
      tp1Triggered: false,
      tp2Triggered: false,
      tp3Triggered: false,
      trailingStopPrice: null,
      stopLossPrice: this.config.stopLoss.enabled ?
        tradeData.price * (1 - this.config.stopLoss.percent / 100) : null,
      breakevenTriggered: false,
      pnl: 0,
      pnlPercent: 0
    };

    this.positions.set(tradeData.id, position);
    logger.info(`📊 Created position for trade ${tradeData.id}`);
    return position;
  }

  resumePosition(tradeData) {
    // Resume monitoring existing position
    const position = this.createPosition(tradeData);
    // Would load additional state from database if needed
  }

  monitorPosition(tradeId) {
    // Position is already being monitored via the monitoring interval
    logger.debug(`👀 Started monitoring position ${tradeId}`);
  }

  startPositionMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      for (const [tradeId, position] of this.positions) {
        try {
          await this.updatePosition(tradeId);
        } catch (error) {
          logger.error(`Error monitoring position ${tradeId}:`, error);
        }
      }
    }, 1000); // Update every second for ultra-fast response
  }

  stopPositionMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async updatePosition(tradeId) {
    const position = this.positions.get(tradeId);
    if (!position) return;

    try {
      // Get current price
      const currentPrice = await jupiterService.getTokenPrice(position.tokenMint);
      if (!currentPrice) return;

      position.currentPrice = currentPrice.price;
      position.highestPrice = Math.max(position.highestPrice, currentPrice.price);

      // Calculate P&L
      this.calculatePnL(position);

      // Check strategy conditions
      await this.checkTakeProfitConditions(position);
      await this.checkTrailingStop(position);
      await this.checkStopLoss(position);
      await this.checkBreakeven(position);

    } catch (error) {
      logger.debug(`Price update failed for position ${tradeId}:`, error.message);
    }
  }

  calculatePnL(position) {
    const currentValue = position.currentPrice * position.amount;
    const investedValue = position.entryPrice * position.amount;
    position.pnl = currentValue - investedValue;
    position.pnlPercent = investedValue > 0 ? (position.pnl / investedValue) * 100 : 0;
  }

  async checkTakeProfitConditions(position) {
    const profitPercent = position.pnlPercent;

    // TP1: 200% profit, sell 30%
    if (!position.tp1Triggered && profitPercent >= this.config.tp1.profitPercent) {
      const sellAmount = position.amount * (this.config.tp1.sellPercent / 100);
      this.emit('takeProfit', {
        tradeId: position.id,
        level: 1,
        amount: sellAmount,
        profitPercent: profitPercent
      });
      position.tp1Triggered = true;
      logger.info(`🎯 TP1 triggered for ${position.id}: ${profitPercent.toFixed(2)}% profit`);
    }

    // TP2: 400% profit, sell 30%
    if (!position.tp2Triggered && profitPercent >= this.config.tp2.profitPercent) {
      const sellAmount = position.amount * (this.config.tp2.sellPercent / 100);
      this.emit('takeProfit', {
        tradeId: position.id,
        level: 2,
        amount: sellAmount,
        profitPercent: profitPercent
      });
      position.tp2Triggered = true;
      logger.info(`🎯 TP2 triggered for ${position.id}: ${profitPercent.toFixed(2)}% profit`);
    }

    // TP3: 600% profit, sell remaining balance
    if (!position.tp3Triggered && profitPercent >= this.config.tp3.profitPercent) {
      const remainingAmount = position.amount * (1 - (this.config.tp1.sellPercent + this.config.tp2.sellPercent) / 100);
      this.emit('takeProfit', {
        tradeId: position.id,
        level: 3,
        amount: remainingAmount,
        profitPercent: profitPercent
      });
      position.tp3Triggered = true;
      logger.info(`🎯 TP3 triggered for ${position.id}: ${profitPercent.toFixed(2)}% profit`);
    }
  }

  async checkTrailingStop(position) {
    if (!this.config.trailingStop.enabled) return;

    const currentProfitPercent = position.pnlPercent;
    const trailingPercent = this.config.trailingStop.percent;

    // Update trailing stop price
    if (currentProfitPercent > trailingPercent) {
      const newStopPrice = position.currentPrice * (1 - trailingPercent / 100);
      if (!position.trailingStopPrice || newStopPrice > position.trailingStopPrice) {
        position.trailingStopPrice = newStopPrice;
        logger.debug(`🔄 Updated trailing stop for ${position.id}: ${newStopPrice.toFixed(6)} SOL`);
      }
    }

    // Check if trailing stop is hit
    if (position.trailingStopPrice && position.currentPrice <= position.trailingStopPrice) {
      this.emit('stopLoss', {
        tradeId: position.id,
        reason: `Trailing stop hit at ${position.currentPrice.toFixed(6)} SOL`
      });
      logger.info(`🚨 Trailing stop triggered for ${position.id}`);
    }
  }

  async checkStopLoss(position) {
    if (!this.config.stopLoss.enabled || !position.stopLossPrice) return;

    if (position.currentPrice <= position.stopLossPrice) {
      this.emit('stopLoss', {
        tradeId: position.id,
        reason: `Stop loss hit at ${position.currentPrice.toFixed(6)} SOL`
      });
      logger.warn(`🛑 Stop loss triggered for ${position.id}`);
    }
  }

  async checkBreakeven(position) {
    if (!this.config.breakevenStop.enabled || position.breakevenTriggered) return;

    const profitPercent = position.pnlPercent;

    // Trigger breakeven when profit reaches configured percentage
    if (profitPercent >= this.config.breakevenStop.profitPercent) {
      position.stopLossPrice = position.entryPrice; // Move SL to breakeven
      position.breakevenTriggered = true;
      logger.info(`🔒 Breakeven stop activated for ${position.id} at ${position.entryPrice.toFixed(6)} SOL`);
    }
  }

  updateAfterTP(tradeId, level) {
    const position = this.positions.get(tradeId);
    if (!position) return;

    // Reduce position amount after TP
    const sellPercent = level === 1 ? this.config.tp1.sellPercent :
                       level === 2 ? this.config.tp2.sellPercent : 100;
    position.amount *= (1 - sellPercent / 100);

    // If position is closed, remove it
    if (position.amount <= 0.000001) { // Dust threshold
      this.positions.delete(tradeId);
      logger.info(`💰 Position ${tradeId} fully closed after TP${level}`);
    }
  }

  getPosition(tradeId) {
    return this.positions.get(tradeId);
  }

  getAllPositions() {
    return Array.from(this.positions.values());
  }

  getPositionsSummary() {
    const positions = this.getAllPositions();
    const summary = {
      totalPositions: positions.length,
      totalValue: 0,
      totalPnL: 0,
      winningPositions: 0,
      losingPositions: 0
    };

    for (const position of positions) {
      const currentValue = position.currentPrice * position.amount;
      summary.totalValue += currentValue;
      summary.totalPnL += position.pnl;

      if (position.pnl > 0) {
        summary.winningPositions++;
      } else if (position.pnl < 0) {
        summary.losingPositions++;
      }
    }

    return summary;
  }

  // Emergency stop all positions
  emergencyStopAll() {
    for (const [tradeId, position] of this.positions) {
      this.emit('stopLoss', {
        tradeId,
        reason: 'Emergency stop all positions'
      });
    }
    this.positions.clear();
    logger.warn('🚨 Emergency stop triggered for all positions');
  }

  // Update strategy configuration at runtime
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('⚙️ Katana strategy configuration updated');
  }
}

module.exports = KatanaStrategy;</content>
<parameter name="filePath">/workspaces/HFT/backend/services/engines/katana.strategy.js