const logger = require('../utils/logger');
const cacheService = require('./cache.service');

class ExecutionAnalyticsService {
  constructor() {
    this.analyticsWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.cacheTTL = 3600; // 1 hour cache
  }

  /**
   * Generate execution analytics for a wallet
   * @param {string} walletId - Wallet ID
   * @param {number} days - Number of days to analyze (default: 7)
   * @returns {Promise<Object>} Execution analytics
   */
  async generateExecutionAnalytics(walletId, days = 7) {
    try {
      logger.info(`📊 Generating execution analytics for wallet ${walletId} (${days} days)`);

      const cacheKey = `execution_analytics:${walletId}:${days}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Get trade history
      const trades = await this.getTradeHistory(walletId, days);

      if (!trades || trades.length === 0) {
        const emptyAnalytics = {
          walletId,
          period: `${days} days`,
          totalTrades: 0,
          successfulTrades: 0,
          failedTrades: 0,
          successRate: 0,
          averageExecutionTime: 0,
          averageSlippage: 0,
          totalVolume: 0,
          pnl: 0,
          bestPerformingToken: null,
          worstPerformingToken: null,
          hourlyDistribution: [],
          error: 'No trade data available'
        };

        await cacheService.set(cacheKey, emptyAnalytics, this.cacheTTL);
        return emptyAnalytics;
      }

      // Calculate basic metrics
      const successfulTrades = trades.filter(t => t.status === 'completed');
      const failedTrades = trades.filter(t => t.status === 'failed');

      const successRate = trades.length > 0 ? (successfulTrades.length / trades.length) * 100 : 0;

      // Calculate execution times
      const executionTimes = successfulTrades
        .filter(t => t.executedAt && t.createdAt)
        .map(t => t.executedAt - t.createdAt);

      const averageExecutionTime = executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
        : 0;

      // Calculate slippage
      const slippages = successfulTrades
        .filter(t => t.slippagePercent !== null)
        .map(t => t.slippagePercent);

      const averageSlippage = slippages.length > 0
        ? slippages.reduce((sum, slip) => sum + slip, 0) / slippages.length
        : 0;

      // Calculate volume and PnL
      const totalVolume = successfulTrades.reduce((sum, t) => sum + (t.totalCostUsd || 0), 0);
      const pnl = successfulTrades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0);

      // Token performance
      const tokenPerformance = this.calculateTokenPerformance(successfulTrades);

      // Hourly distribution
      const hourlyDistribution = this.calculateHourlyDistribution(trades);

      // Error analysis
      const errorAnalysis = this.analyzeErrors(failedTrades);

      const roiPercent = totalVolume > 0 ? Math.round((pnl / totalVolume) * 10000) / 100 : 0;
      const averageTradePnl = successfulTrades.length > 0
        ? Math.round(successfulTrades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0) / successfulTrades.length * 100) / 100
        : 0;

      const analytics = {
        walletId,
        period: `${days} days`,
        totalTrades: trades.length,
        successfulTrades: successfulTrades.length,
        failedTrades: failedTrades.length,
        successRate: Math.round(successRate * 100) / 100,
        winRate: Math.round(successRate * 100) / 100,
        roiPercent,
        averageTradePnl,
        averageExecutionTime: Math.round(averageExecutionTime / 1000), // Convert to seconds
        averageSlippage: Math.round(averageSlippage * 10000) / 100, // Convert to basis points
        totalVolume: Math.round(totalVolume * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        bestPerformingToken: tokenPerformance.best,
        worstPerformingToken: tokenPerformance.worst,
        hourlyDistribution,
        tradeHeatmap: this.calculateTradeHeatmap(trades),
        errorAnalysis,
        generatedAt: Date.now()
      };

      // Cache results
      await cacheService.set(cacheKey, analytics, this.cacheTTL);

      logger.info(`📊 Execution analytics generated for ${walletId}: ${analytics.totalTrades} trades, ${analytics.successRate}% success rate`);

      return analytics;

    } catch (error) {
      logger.error(`Error generating execution analytics for ${walletId}:`, error);
      return {
        walletId,
        error: error.message,
        generatedAt: Date.now()
      };
    }
  }

  /**
   * Get trade history for analytics
   * @param {string} walletId - Wallet ID
   * @param {number} days - Number of days
   * @returns {Promise<Array>} Array of trades
   */
  async getTradeHistory(walletId, days) {
    try {
      // In a real implementation, this would query the database
      // For now, we'll simulate with cached/generated data
      const cacheKey = `trade_history:${walletId}:${days}`;
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Generate mock trade history
      const mockTrades = this.generateMockTradeHistory(walletId, days);

      // Cache for 30 minutes
      await cacheService.set(cacheKey, mockTrades, 1800);

      return mockTrades;

    } catch (error) {
      logger.error(`Error getting trade history for ${walletId}:`, error);
      return [];
    }
  }

  /**
   * Generate mock trade history for demonstration
   * @param {string} walletId - Wallet ID
   * @param {number} days - Number of days
   * @returns {Array} Mock trades
   */
  generateMockTradeHistory(walletId, days) {
    const trades = [];
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);

    // Generate 50-200 random trades
    const numTrades = Math.floor(Math.random() * 150) + 50;

    for (let i = 0; i < numTrades; i++) {
      const timestamp = startTime + Math.random() * (now - startTime);
      const isSuccessful = Math.random() > 0.15; // 85% success rate

      const trade = {
        tradeId: `trade_${Date.now()}_${i}`,
        walletId,
        strategyType: ['arbitrage', 'sniper', 'smartmoney', 'trading'][Math.floor(Math.random() * 4)],
        status: isSuccessful ? 'completed' : 'failed',
        direction: Math.random() > 0.5 ? 'BUY' : 'SELL',
        inputTokenMint: 'So11111111111111111111111111111111111111112', // SOL
        outputTokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        inputAmount: Math.random() * 10 + 1,
        expectedOutputAmount: Math.random() * 1500 + 100,
        actualOutputAmount: isSuccessful ? Math.random() * 1500 + 100 : null,
        expectedPrice: 150 + (Math.random() - 0.5) * 20,
        actualPrice: isSuccessful ? 150 + (Math.random() - 0.5) * 20 : null,
        slippagePercent: isSuccessful ? (Math.random() - 0.5) * 0.02 : null, // ±1%
        transactionFee: Math.random() * 0.01,
        totalCostUsd: Math.random() * 100 + 10,
        pnlUsd: isSuccessful ? (Math.random() - 0.4) * 50 : 0, // Slightly positive bias
        executedAt: isSuccessful ? timestamp + Math.random() * 30000 : null, // 0-30 seconds execution time
        createdAt: timestamp,
        errorMessage: isSuccessful ? null : ['Slippage too high', 'RPC error', 'Insufficient funds'][Math.floor(Math.random() * 3)]
      };

      trades.push(trade);
    }

    // Sort by timestamp
    trades.sort((a, b) => a.createdAt - b.createdAt);

    return trades;
  }

  /**
   * Calculate token performance
   * @param {Array} trades - Successful trades
   * @returns {Object} Token performance data
   */
  calculateTokenPerformance(trades) {
    const tokenPnL = {};

    trades.forEach(trade => {
      const token = trade.outputTokenMint;
      if (!tokenPnL[token]) {
        tokenPnL[token] = { totalPnL: 0, tradeCount: 0 };
      }
      tokenPnL[token].totalPnL += trade.pnlUsd || 0;
      tokenPnL[token].tradeCount++;
    });

    let best = null;
    let worst = null;
    let bestPnL = -Infinity;
    let worstPnL = Infinity;

    for (const [token, data] of Object.entries(tokenPnL)) {
      const avgPnL = data.totalPnL / data.tradeCount;

      if (avgPnL > bestPnL) {
        bestPnL = avgPnL;
        best = { token, avgPnL: Math.round(avgPnL * 100) / 100, tradeCount: data.tradeCount };
      }

      if (avgPnL < worstPnL) {
        worstPnL = avgPnL;
        worst = { token, avgPnL: Math.round(avgPnL * 100) / 100, tradeCount: data.tradeCount };
      }
    }

    return { best, worst };
  }

  /**
   * Calculate hourly trade distribution
   * @param {Array} trades - All trades
   * @returns {Array} Hourly distribution
   */
  calculateHourlyDistribution(trades) {
    const hourly = new Array(24).fill(0);

    trades.forEach(trade => {
      const hour = new Date(trade.createdAt).getHours();
      hourly[hour]++;
    });

    return hourly.map((count, hour) => ({
      hour,
      trades: count,
      percentage: trades.length > 0 ? Math.round((count / trades.length) * 10000) / 100 : 0
    }));
  }

  calculateTradeHeatmap(trades) {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap = dayLabels.map(day => ({
      day,
      hours: new Array(24).fill(0)
    }));

    trades.forEach(trade => {
      const date = new Date(trade.createdAt);
      const dayIndex = date.getDay();
      const hour = date.getHours();
      heatmap[dayIndex].hours[hour] += 1;
    });

    const maxCount = heatmap.reduce((max, row) => {
      const rowMax = Math.max(...row.hours);
      return Math.max(max, rowMax);
    }, 0);

    return {
      days: dayLabels,
      maxCount,
      rows: heatmap
    };
  }

  /**
   * Analyze trade errors
   * @param {Array} failedTrades - Failed trades
   * @returns {Object} Error analysis
   */
  analyzeErrors(failedTrades) {
    const errorCounts = {};

    failedTrades.forEach(trade => {
      const error = trade.errorMessage || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));

    return {
      totalErrors: failedTrades.length,
      topErrors,
      errorRate: failedTrades.length > 0 ? Math.round((failedTrades.length / (failedTrades.length + 1)) * 10000) / 100 : 0
    };
  }

  /**
   * Get performance comparison with benchmarks
   * @param {string} walletId - Wallet ID
   * @param {number} days - Number of days
   * @returns {Promise<Object>} Performance comparison
   */
  async getPerformanceComparison(walletId, days = 30) {
    try {
      const analytics = await this.generateExecutionAnalytics(walletId, days);

      // Mock benchmark data (would be real market data in production)
      const benchmark = {
        successRate: 78.5,
        averageSlippage: 45, // basis points
        sharpeRatio: 1.2
      };

      const comparison = {
        walletId,
        period: analytics.period,
        walletMetrics: {
          successRate: analytics.successRate,
          averageSlippage: analytics.averageSlippage,
          pnl: analytics.pnl
        },
        benchmark,
        comparison: {
          successRateDiff: Math.round((analytics.successRate - benchmark.successRate) * 100) / 100,
          slippageDiff: Math.round((analytics.averageSlippage - benchmark.averageSlippage) * 100) / 100
        }
      };

      return comparison;

    } catch (error) {
      logger.error(`Error getting performance comparison for ${walletId}:`, error);
      return { error: error.message };
    }
  }
}

module.exports = new ExecutionAnalyticsService();