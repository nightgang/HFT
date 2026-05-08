const logger = require('../utils/logger');
const tradingEngine = require('./engines/trading.engine');
const cacheService = require('./cache.service');

class PortfolioRebalancingService {
  constructor() {
    this.rebalanceThreshold = 0.05; // 5% deviation triggers rebalance
    this.maxRebalanceTrades = 3; // Maximum trades per rebalance
    this.cooldownPeriod = 5 * 60 * 1000; // 5 minutes between rebalances
    this.lastRebalance = new Map(); // wallet -> timestamp
  }

  /**
   * Check if portfolio needs rebalancing
   * @param {string} walletId - Wallet ID
   * @param {Object} targetAllocations - Target allocations {tokenMint: percentage}
   * @returns {Promise<Object>} Rebalance analysis
   */
  async analyzeRebalanceNeed(walletId, targetAllocations) {
    try {
      logger.info(`⚖️ Analyzing portfolio rebalance for wallet ${walletId}`);

      // Get current portfolio
      const currentPortfolio = await this.getCurrentPortfolio(walletId);
      if (!currentPortfolio || currentPortfolio.length === 0) {
        return { needsRebalance: false, reason: 'No portfolio data available' };
      }

      // Calculate current allocations
      const totalValue = currentPortfolio.reduce((sum, holding) => sum + holding.valueUSD, 0);
      const currentAllocations = {};

      currentPortfolio.forEach(holding => {
        currentAllocations[holding.tokenMint] = holding.valueUSD / totalValue;
      });

      // Check for deviations
      const deviations = {};
      let maxDeviation = 0;
      let needsRebalance = false;

      for (const [tokenMint, targetPct] of Object.entries(targetAllocations)) {
        const currentPct = currentAllocations[tokenMint] || 0;
        const deviation = Math.abs(currentPct - targetPct);
        deviations[tokenMint] = {
          target: targetPct,
          current: currentPct,
          deviation: deviation,
          needsAdjustment: deviation > this.rebalanceThreshold
        };

        if (deviation > maxDeviation) {
          maxDeviation = deviation;
        }

        if (deviation > this.rebalanceThreshold) {
          needsRebalance = true;
        }
      }

      // Check cooldown period
      const lastRebalanceTime = this.lastRebalance.get(walletId);
      const now = Date.now();
      const cooldownActive = lastRebalanceTime && (now - lastRebalanceTime) < this.cooldownPeriod;

      if (cooldownActive) {
        needsRebalance = false;
      }

      const result = {
        walletId,
        needsRebalance,
        maxDeviation: Math.round(maxDeviation * 10000) / 100, // Convert to percentage
        totalValue: Math.round(totalValue * 100) / 100,
        deviations,
        cooldownActive,
        analysisTimestamp: now
      };

      logger.info(`⚖️ Rebalance analysis complete for ${walletId}: ${needsRebalance ? 'REBALANCE NEEDED' : 'BALANCED'} (max deviation: ${result.maxDeviation}%)`);

      return result;

    } catch (error) {
      logger.error(`Error analyzing rebalance for wallet ${walletId}:`, error);
      return { needsRebalance: false, error: error.message };
    }
  }

  /**
   * Execute portfolio rebalancing
   * @param {string} walletId - Wallet ID
   * @param {Object} targetAllocations - Target allocations
   * @returns {Promise<Object>} Rebalance execution result
   */
  async executeRebalance(walletId, targetAllocations) {
    try {
      logger.info(`🔄 Executing portfolio rebalance for wallet ${walletId}`);

      // Check if rebalance is needed
      const analysis = await this.analyzeRebalanceNeed(walletId, targetAllocations);
      if (!analysis.needsRebalance) {
        return {
          success: false,
          reason: analysis.reason || 'Rebalance not needed',
          analysis
        };
      }

      // Get current portfolio
      const currentPortfolio = await this.getCurrentPortfolio(walletId);
      const totalValue = currentPortfolio.reduce((sum, holding) => sum + holding.valueUSD, 0);

      // Calculate required trades
      const trades = this.calculateRebalanceTrades(currentPortfolio, totalValue, targetAllocations);

      if (trades.length === 0) {
        return {
          success: false,
          reason: 'No trades calculated',
          analysis
        };
      }

      // Limit number of trades
      const limitedTrades = trades.slice(0, this.maxRebalanceTrades);

      // Execute trades
      const executedTrades = [];
      for (const trade of limitedTrades) {
        try {
          const result = await this.executeRebalanceTrade(walletId, trade);
          executedTrades.push(result);

          // Small delay between trades
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          logger.error(`Failed to execute rebalance trade:`, error);
          executedTrades.push({
            ...trade,
            success: false,
            error: error.message
          });
        }
      }

      // Update last rebalance timestamp
      this.lastRebalance.set(walletId, Date.now());

      const result = {
        success: true,
        walletId,
        totalValue: Math.round(totalValue * 100) / 100,
        tradesExecuted: executedTrades.length,
        trades: executedTrades,
        analysis,
        timestamp: Date.now()
      };

      logger.info(`🔄 Portfolio rebalance completed for ${walletId}: ${executedTrades.length} trades executed`);

      return result;

    } catch (error) {
      logger.error(`Error executing rebalance for wallet ${walletId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current portfolio holdings
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Array>} Array of holdings
   */
  async getCurrentPortfolio(walletId) {
    try {
      // In a real implementation, this would query the database
      // For now, we'll simulate with cached data
      const cacheKey = `portfolio:${walletId}`;
      const cachedPortfolio = await cacheService.get(cacheKey);

      if (cachedPortfolio) {
        return cachedPortfolio;
      }

      // Simulate portfolio data (replace with actual database query)
      const mockPortfolio = await this.generateMockPortfolio(walletId);

      // Cache for 30 seconds
      await cacheService.set(cacheKey, mockPortfolio, 30);

      return mockPortfolio;

    } catch (error) {
      logger.error(`Error getting portfolio for ${walletId}:`, error);
      return [];
    }
  }

  /**
   * Generate mock portfolio data for demonstration
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Array>} Mock portfolio
   */
  async generateMockPortfolio(walletId) {
    // Simulate holdings in different tokens
    const tokens = [
      { mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL', price: 150 },
      { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', price: 1 },
      { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', price: 1 },
    ];

    const holdings = tokens.map(token => {
      const amount = Math.random() * 100 + 10; // Random amount 10-110
      const valueUSD = amount * token.price;

      return {
        tokenMint: token.mint,
        symbol: token.symbol,
        amount: Math.round(amount * 100) / 100,
        priceUSD: token.price,
        valueUSD: Math.round(valueUSD * 100) / 100
      };
    });

    return holdings;
  }

  /**
   * Calculate required trades for rebalancing
   * @param {Array} currentPortfolio - Current holdings
   * @param {number} totalValue - Total portfolio value
   * @param {Object} targetAllocations - Target allocations
   * @returns {Array} Array of required trades
   */
  calculateRebalanceTrades(currentPortfolio, totalValue, targetAllocations) {
    const trades = [];
    const currentAllocations = {};

    // Calculate current allocations
    currentPortfolio.forEach(holding => {
      currentAllocations[holding.tokenMint] = holding.valueUSD / totalValue;
    });

    // Calculate required adjustments
    for (const [tokenMint, targetPct] of Object.entries(targetAllocations)) {
      const currentPct = currentAllocations[tokenMint] || 0;
      const deviation = targetPct - currentPct;

      if (Math.abs(deviation) > this.rebalanceThreshold) {
        const targetValue = totalValue * targetPct;
        const currentValue = totalValue * currentPct;
        const adjustmentValue = targetValue - currentValue;

        // Find the holding
        const holding = currentPortfolio.find(h => h.tokenMint === tokenMint);

        if (holding) {
          const adjustmentAmount = adjustmentValue / holding.priceUSD;

          trades.push({
            tokenMint,
            symbol: holding.symbol,
            action: adjustmentValue > 0 ? 'BUY' : 'SELL',
            amount: Math.abs(Math.round(adjustmentAmount * 100) / 100),
            valueUSD: Math.abs(Math.round(adjustmentValue * 100) / 100),
            currentPct: Math.round(currentPct * 10000) / 100,
            targetPct: Math.round(targetPct * 10000) / 100,
            deviation: Math.round(deviation * 10000) / 100
          });
        }
      }
    }

    // Sort by deviation magnitude
    trades.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

    return trades;
  }

  /**
   * Execute a single rebalance trade
   * @param {string} walletId - Wallet ID
   * @param {Object} trade - Trade details
   * @returns {Promise<Object>} Trade execution result
   */
  async executeRebalanceTrade(walletId, trade) {
    try {
      logger.info(`🔄 Executing rebalance trade: ${trade.action} ${trade.amount} ${trade.symbol} for wallet ${walletId}`);

      // In a real implementation, this would call the trading engine
      // For now, simulate successful execution
      const result = {
        ...trade,
        success: true,
        txSignature: `simulated_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        executedAt: Date.now(),
        executionPrice: trade.symbol === 'SOL' ? 150 : 1, // Mock prices
        fees: Math.round(trade.valueUSD * 0.001 * 100) / 100 // 0.1% fee
      };

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 500));

      logger.info(`✅ Rebalance trade executed: ${result.txSignature}`);

      return result;

    } catch (error) {
      logger.error(`Error executing rebalance trade:`, error);
      throw error;
    }
  }

  /**
   * Set rebalance parameters for a wallet
   * @param {string} walletId - Wallet ID
   * @param {Object} params - Rebalance parameters
   */
  setRebalanceParams(walletId, params) {
    const cacheKey = `rebalance_params:${walletId}`;
    cacheService.set(cacheKey, {
      ...params,
      updatedAt: Date.now()
    }, 86400); // Cache for 24 hours
  }

  /**
   * Get rebalance parameters for a wallet
   * @param {string} walletId - Wallet ID
   * @returns {Promise<Object>} Rebalance parameters
   */
  async getRebalanceParams(walletId) {
    const cacheKey = `rebalance_params:${walletId}`;
    const params = await cacheService.get(cacheKey);

    return params || {
      enabled: false,
      targetAllocations: {},
      threshold: this.rebalanceThreshold,
      maxTrades: this.maxRebalanceTrades
    };
  }
}

module.exports = new PortfolioRebalancingService();