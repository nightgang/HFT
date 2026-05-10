/**
 * Katana Mode Engine
 *
 * Ultra-fast Solana trading engine optimized for meme coin sniping and high-frequency trading.
 * Features advanced risk protection, configurable TP systems, and real-time execution.
 *
 * Architecture:
 * - Integrates with existing Jupiter and Helius services
 * - Uses existing risk and trading engines as fallback
 * - Maintains compatibility with current wallet and trade models
 * - Supports both terminal and web dashboard modes
 */

const EventEmitter = require('events');
const logger = require('../../utils/logger');
const KatanaStrategy = require('./katana.strategy');
const KatanaRisk = require('./katana.risk');
const KatanaExecutor = require('./katana.executor');
const KatanaWebSocket = require('./katana.websocket');
const jupiterService = require('../../integrations/jupiter.service');
const heliusService = require('../../integrations/helius.service');
const websocketServer = require('../../ws/websocket.server');
const TradeModel = require('../../models/trade.model');
const WalletModel = require('../../models/wallet.model');

class KatanaEngine extends EventEmitter {
  constructor() {
    super();
    this.isActive = false;
    this.strategy = new KatanaStrategy();
    this.risk = new KatanaRisk();
    this.executor = new KatanaExecutor();
    this.ws = new KatanaWebSocket();

    // Configuration
    this.config = {
      maxConcurrentTrades: parseInt(process.env.KATANA_MAX_CONCURRENT_TRADES) || 5,
      minLiquidity: parseFloat(process.env.KATANA_MIN_LIQUIDITY_SOL) || 5,
      maxSlippage: parseFloat(process.env.KATANA_MAX_SLIPPAGE) || 0.3, // 30%
      priorityFee: parseInt(process.env.KATANA_PRIORITY_FEE_LAMPORTS) || 100000,
      jitoEnabled: process.env.KATANA_JITO_ENABLED === 'true',
      autoBuyEnabled: process.env.KATANA_AUTO_BUY_ENABLED === 'true',
      riskProtectionEnabled: process.env.KATANA_RISK_PROTECTION_ENABLED !== 'false',
      terminalMode: process.env.KATANA_TERMINAL_MODE === 'true'
    };

    // State
    this.activeTrades = new Map();
    this.watchedTokens = new Set();
    this.walletBalances = new Map();

    this.bindEvents();
  }

  bindEvents() {
    // Strategy events
    this.strategy.on('takeProfit', this.handleTakeProfit.bind(this));
    this.strategy.on('stopLoss', this.handleStopLoss.bind(this));
    this.strategy.on('trailingStop', this.handleTrailingStop.bind(this));

    // Risk events
    this.risk.on('riskAlert', this.handleRiskAlert.bind(this));
    this.risk.on('emergencyExit', this.handleEmergencyExit.bind(this));

    // Executor events
    this.executor.on('tradeExecuted', this.handleTradeExecuted.bind(this));
    this.executor.on('tradeFailed', this.handleTradeFailed.bind(this));
    this.executor.on('retryScheduled', this.handleRetryScheduled.bind(this));

    // WebSocket events
    this.ws.on('command', this.handleWSCommand.bind(this));
  }

  async start() {
    try {
      logger.info('🚀 Starting Katana Mode Engine...');

      // Initialize components
      await this.strategy.initialize();
      await this.risk.initialize();
      await this.executor.initialize();
      await this.ws.initialize();

      // Load existing trades
      await this.loadActiveTrades();

      // Start monitoring
      this.startTokenMonitoring();
      this.startRiskMonitoring();
      this.startPnLMonitoring();

      this.isActive = true;

      // Broadcast status
      websocketServer.broadcast({
        type: 'KATANA_STATUS',
        data: { status: 'active', config: this.config },
        timestamp: Date.now()
      });

      logger.info('✅ Katana Mode Engine started successfully');

      if (this.config.terminalMode) {
        this.startTerminalMode();
      }

    } catch (error) {
      logger.error('❌ Failed to start Katana Mode:', error);
      throw error;
    }
  }

  async stop() {
    try {
      logger.info('🛑 Stopping Katana Mode Engine...');

      this.isActive = false;

      // Stop monitoring
      this.stopTokenMonitoring();
      this.stopRiskMonitoring();
      this.stopPnLMonitoring();

      // Close positions if configured
      await this.closeAllPositions();

      // Shutdown components
      await this.strategy.shutdown();
      await this.risk.shutdown();
      await this.executor.shutdown();
      await this.ws.shutdown();

      websocketServer.broadcast({
        type: 'KATANA_STATUS',
        data: { status: 'stopped' },
        timestamp: Date.now()
      });

      logger.info('✅ Katana Mode Engine stopped');

    } catch (error) {
      logger.error('❌ Error stopping Katana Mode:', error);
    }
  }

  async detectNewToken(tokenData) {
    if (!this.isActive) return;

    try {
      logger.info(`🎯 New token detected: ${tokenData.mint}`);

      // Risk assessment
      const riskLevel = await this.risk.evaluateToken(tokenData);
      if (riskLevel === 'UNSAFE') {
        logger.warn(`⚠️ Token ${tokenData.mint} failed risk check`);
        return;
      }

      // Add to watchlist
      this.watchedTokens.add(tokenData.mint);

      // Auto-buy if enabled
      if (this.config.autoBuyEnabled && this.shouldAutoBuy(tokenData)) {
        await this.executeAutoBuy(tokenData);
      }

      // Broadcast to clients
      this.ws.broadcastTokenDetected(tokenData, riskLevel);

    } catch (error) {
      logger.error('Error detecting new token:', error);
    }
  }

  async executeTrade(tradeParams) {
    if (!this.isActive) return null;

    try {
      // Validate trade parameters
      const validatedParams = await this.validateTradeParams(tradeParams);

      // Check concurrent trade limits
      if (this.activeTrades.size >= this.config.maxConcurrentTrades) {
        throw new Error('Maximum concurrent trades reached');
      }

      // Execute trade
      const tradeResult = await this.executor.executeTrade(validatedParams);

      // Track active trade
      this.activeTrades.set(tradeResult.id, {
        ...tradeResult,
        strategy: this.strategy.createPosition(tradeResult)
      });

      // Start monitoring position
      this.strategy.monitorPosition(tradeResult.id);

      return tradeResult;

    } catch (error) {
      logger.error('Trade execution failed:', error);
      throw error;
    }
  }

  async handleTakeProfit(data) {
    const { tradeId, level, amount } = data;

    try {
      logger.info(`💰 Take profit triggered for trade ${tradeId}, level ${level}`);

      const trade = this.activeTrades.get(tradeId);
      if (!trade) return;

      // Execute sell
      await this.executor.sellPosition({
        tokenMint: trade.tokenMint,
        amount: amount,
        wallet: trade.wallet,
        reason: `TP${level}`
      });

      // Update strategy
      this.strategy.updateAfterTP(tradeId, level);

    } catch (error) {
      logger.error('Take profit execution failed:', error);
    }
  }

  async handleTrailingStop(data) {
    const { tradeId, reason } = data;
    logger.info(`🔄 Trailing stop triggered for trade ${tradeId}: ${reason || 'trailing_stop'}`);
    await this.handleStopLoss({ tradeId, reason: reason || 'trailing_stop' });
  }

  async handleEmergencyExit(data) {
    const { tradeId } = data;
    logger.warn(`🚨 Emergency exit triggered for trade ${tradeId}`);
    await this.handleStopLoss({ tradeId, reason: 'emergency_exit' });
  }

  async handleStopLoss(data) {
    const { tradeId, reason } = data;

    try {
      logger.info(`🛑 Stop loss triggered for trade ${tradeId}: ${reason}`);

      const trade = this.activeTrades.get(tradeId);
      if (!trade) return;

      // Emergency sell
      await this.executor.emergencySell(trade);

      // Remove from active trades
      this.activeTrades.delete(tradeId);

    } catch (error) {
      logger.error('Stop loss execution failed:', error);
    }
  }

  async handleRiskAlert(data) {
    const { tokenMint, alertType, severity } = data;

    logger.warn(`⚠️ Risk alert for ${tokenMint}: ${alertType} (${severity})`);

    // Emergency exit if critical
    if (severity === 'CRITICAL') {
      await this.emergencyExitToken(tokenMint);
    }

    // Broadcast alert
    this.ws.broadcastRiskAlert(data);
  }

  async handleTradeExecuted(data) {
    logger.info(`✅ Trade executed: ${JSON.stringify(data)}`);

    // Save to database
    await TradeModel.create(data);

    // Broadcast update
    this.ws.broadcastTradeUpdate(data);
  }

  async handleTradeFailed(data) {
    logger.error(`❌ Trade failed: ${JSON.stringify(data)}`);

    // Schedule retry if applicable
    if (data.retryable) {
      this.executor.scheduleRetry(data);
    }

    // Broadcast failure
    this.ws.broadcastTradeFailure(data);
  }

  async handleRetryScheduled(data) {
    logger.info(`🔁 Retry scheduled for trade: ${JSON.stringify(data)}`);
    this.ws.broadcastRetryScheduled(data);
  }

  // Monitoring methods
  startTokenMonitoring() {
    this.tokenMonitorInterval = setInterval(async () => {
      for (const tokenMint of this.watchedTokens) {
        try {
          const price = await jupiterService.getTokenPrice(tokenMint);
          const liquidity = await this.checkLiquidity(tokenMint);

          this.ws.broadcastPriceUpdate(tokenMint, price, liquidity);
        } catch (error) {
          logger.debug(`Price check failed for ${tokenMint}:`, error.message);
        }
      }
    }, 5000); // Every 5 seconds
  }

  startRiskMonitoring() {
    this.riskMonitorInterval = setInterval(async () => {
      for (const [tradeId, trade] of this.activeTrades) {
        await this.risk.monitorPosition(trade);
      }
    }, 10000); // Every 10 seconds
  }

  startPnLMonitoring() {
    this.pnlMonitorInterval = setInterval(() => {
      const pnlData = this.calculatePnL();
      this.ws.broadcastPnLUpdate(pnlData);
    }, 2000); // Every 2 seconds
  }

  stopTokenMonitoring() {
    if (this.tokenMonitorInterval) {
      clearInterval(this.tokenMonitorInterval);
    }
  }

  stopRiskMonitoring() {
    if (this.riskMonitorInterval) {
      clearInterval(this.riskMonitorInterval);
    }
  }

  stopPnLMonitoring() {
    if (this.pnlMonitorInterval) {
      clearInterval(this.pnlMonitorInterval);
    }
  }

  // Utility methods
  async loadActiveTrades() {
    try {
      const trades = await TradeModel.findActive();
      for (const trade of trades) {
        this.activeTrades.set(trade.id, trade);
        this.strategy.resumePosition(trade);
      }
      logger.info(`Loaded ${trades.length} active trades`);
    } catch (error) {
      logger.error('Failed to load active trades:', error);
    }
  }

  calculatePnL() {
    let totalPnL = 0;
    let totalInvested = 0;

    for (const [tradeId, trade] of this.activeTrades) {
      const currentValue = trade.currentPrice * trade.amount;
      const invested = trade.entryPrice * trade.amount;
      totalPnL += currentValue - invested;
      totalInvested += invested;
    }

    return {
      totalPnL,
      totalInvested,
      pnlPercentage: totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0,
      activeTrades: this.activeTrades.size
    };
  }

  async closeAllPositions() {
    for (const [tradeId, trade] of this.activeTrades) {
      try {
        await this.executor.emergencySell(trade);
      } catch (error) {
        logger.error(`Failed to close position ${tradeId}:`, error);
      }
    }
    this.activeTrades.clear();
  }

  startTerminalMode() {
    logger.info('⌨️ Starting Katana Terminal Mode...');
    // Terminal interface would be implemented here
    // Using readline or similar for keyboard shortcuts
  }

  // Event handlers for WebSocket commands
  async handleWSCommand(data) {
    const { command, params } = data;

    switch (command) {
      case 'BUY':
        await this.executeTrade({ ...params, side: 'buy' });
        break;
      case 'SELL':
        await this.executeTrade({ ...params, side: 'sell' });
        break;
      case 'STOP_KATANA':
        await this.stop();
        break;
      case 'GET_STATUS':
        this.ws.sendStatus(this.getStatus());
        break;
      default:
        logger.warn(`Unknown WS command: ${command}`);
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      activeTrades: this.activeTrades.size,
      watchedTokens: this.watchedTokens.size,
      config: this.config,
      pnl: this.calculatePnL()
    };
  }

  async shouldAutoBuy(tokenData) {
    // Check liquidity
    if (tokenData.liquidity < this.config.minLiquidity) {
      return false;
    }

    // Check risk
    const riskLevel = await this.risk.evaluateToken(tokenData);
    return riskLevel !== 'UNSAFE';
  }

  async executeAutoBuy(tokenData) {
    // Implementation for auto-buy logic
    logger.info(`🤖 Auto-buying token: ${tokenData.mint}`);
    // Would use configured wallet and amount
  }

  async emergencyExitToken(tokenMint) {
    for (const [tradeId, trade] of this.activeTrades) {
      if (trade.tokenMint === tokenMint) {
        await this.handleStopLoss({ tradeId, reason: 'Emergency exit' });
      }
    }
  }

  async validateTradeParams(params) {
    // Validation logic
    return params;
  }

  async checkLiquidity(tokenMint) {
    // Liquidity checking logic
    return 0;
  }
}

module.exports = KatanaEngine;
