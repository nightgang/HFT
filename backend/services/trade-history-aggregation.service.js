const { TradeModel } = require('../models/trade.model');
const cacheService = require('./cache.service');
const logger = require('../utils/logger');

class TradeHistoryAggregationService {
  constructor() {
    this.aggregationCacheTTL = 3600; // 1 hour
    this.maxAggregationDays = 365; // 1 year
  }

  // Aggregate trade history by time periods
  async aggregateTradesByTimeframe(walletId, timeframe = '1d', days = 30) {
    try {
      const cacheKey = `trade_agg:${walletId}:${timeframe}:${days}`;
      const cached = await cacheService.getCompressed(cacheKey);

      if (cached) {
        return cached;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const trades = await TradeModel.getByWalletAndDateRange(walletId, startDate, endDate);

      const aggregated = this.aggregateByTimeframe(trades, timeframe);

      await cacheService.setCompressed(cacheKey, aggregated, this.aggregationCacheTTL);

      return aggregated;
    } catch (error) {
      logger.error('Error aggregating trades by timeframe:', error);
      throw error;
    }
  }

  // Aggregate trades by timeframe helper
  aggregateByTimeframe(trades, timeframe) {
    const grouped = {};

    trades.forEach(trade => {
      const timeKey = this.getTimeKey(trade.executed_at, timeframe);

      if (!grouped[timeKey]) {
        grouped[timeKey] = {
          timestamp: timeKey,
          volume: 0,
          tradeCount: 0,
          buyVolume: 0,
          sellVolume: 0,
          avgPrice: 0,
          priceChange: 0,
          tokens: new Set(),
          pairs: new Set()
        };
      }

      const group = grouped[timeKey];
      group.volume += trade.amount * trade.price;
      group.tradeCount += 1;

      if (trade.side === 'buy') {
        group.buyVolume += trade.amount * trade.price;
      } else {
        group.sellVolume += trade.amount * trade.price;
      }

      group.tokens.add(trade.token_mint);
      group.pairs.add(`${trade.token_mint}-${trade.quote_mint || 'SOL'}`);
    });

    // Calculate averages and changes
    const result = Object.values(grouped).map(group => ({
      ...group,
      tokens: Array.from(group.tokens),
      pairs: Array.from(group.pairs),
      avgPrice: group.volume / group.tradeCount,
      netFlow: group.buyVolume - group.sellVolume
    }));

    return result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Get time key for aggregation
  getTimeKey(timestamp, timeframe) {
    const date = new Date(timestamp);

    switch (timeframe) {
      case '1m':
        return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      case '5m':
        const minutes = Math.floor(date.getMinutes() / 5) * 5;
        date.setMinutes(minutes, 0, 0);
        return date.toISOString().slice(0, 16);
      case '15m':
        const quarterHour = Math.floor(date.getMinutes() / 15) * 15;
        date.setMinutes(quarterHour, 0, 0);
        return date.toISOString().slice(0, 16);
      case '1h':
        date.setMinutes(0, 0, 0);
        return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      case '4h':
        const fourHour = Math.floor(date.getHours() / 4) * 4;
        date.setHours(fourHour, 0, 0, 0);
        return date.toISOString().slice(0, 13);
      case '1d':
        date.setHours(0, 0, 0, 0);
        return date.toISOString().slice(0, 10); // YYYY-MM-DD
      case '1w':
        const dayOfWeek = date.getDay();
        date.setDate(date.getDate() - dayOfWeek);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().slice(0, 10);
      case '1M':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().slice(0, 7); // YYYY-MM
      default:
        return date.toISOString().slice(0, 10);
    }
  }

  // Get trade statistics
  async getTradeStatistics(walletId, days = 30) {
    try {
      const cacheKey = `trade_stats:${walletId}:${days}`;
      const cached = await cacheService.getCompressed(cacheKey);

      if (cached) {
        return cached;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const trades = await TradeModel.getByWalletAndDateRange(walletId, startDate, endDate);

      const stats = this.calculateTradeStatistics(trades);

      await cacheService.setCompressed(cacheKey, stats, this.aggregationCacheTTL);

      return stats;
    } catch (error) {
      logger.error('Error getting trade statistics:', error);
      throw error;
    }
  }

  // Calculate comprehensive trade statistics
  calculateTradeStatistics(trades) {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        totalVolume: 0,
        avgTradeSize: 0,
        winRate: 0,
        profitLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgHoldingTime: 0,
        mostTradedToken: null,
        tradingFrequency: 0,
        volatility: 0
      };
    }

    const totalVolume = trades.reduce((sum, trade) => sum + (trade.amount * trade.price), 0);
    const avgTradeSize = totalVolume / trades.length;

    // Calculate P&L (simplified - assuming we have entry/exit prices)
    const profitableTrades = trades.filter(trade => trade.pnl > 0);
    const winRate = (profitableTrades.length / trades.length) * 100;

    const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const bestTrade = Math.max(...trades.map(trade => trade.pnl || 0));
    const worstTrade = Math.min(...trades.map(trade => trade.pnl || 0));

    // Token frequency analysis
    const tokenCounts = {};
    trades.forEach(trade => {
      tokenCounts[trade.token_mint] = (tokenCounts[trade.token_mint] || 0) + 1;
    });
    const mostTradedToken = Object.entries(tokenCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Trading frequency (trades per day)
    const daysSpan = Math.max(1, (new Date(trades[trades.length - 1].executed_at) - new Date(trades[0].executed_at)) / (1000 * 60 * 60 * 24));
    const tradingFrequency = trades.length / daysSpan;

    // Price volatility (coefficient of variation)
    const prices = trades.map(trade => trade.price);
    const meanPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - meanPrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / meanPrice;

    return {
      totalTrades: trades.length,
      totalVolume,
      avgTradeSize,
      winRate,
      profitLoss: totalPnL,
      bestTrade,
      worstTrade,
      mostTradedToken,
      tradingFrequency,
      volatility,
      periodDays: Math.ceil(daysSpan)
    };
  }

  // Get trade patterns and insights
  async getTradePatterns(walletId, days = 30) {
    try {
      const cacheKey = `trade_patterns:${walletId}:${days}`;
      const cached = await cacheService.getCompressed(cacheKey);

      if (cached) {
        return cached;
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const trades = await TradeModel.getByWalletAndDateRange(walletId, startDate, endDate);

      const patterns = this.analyzeTradePatterns(trades);

      await cacheService.setCompressed(cacheKey, patterns, this.aggregationCacheTTL);

      return patterns;
    } catch (error) {
      logger.error('Error getting trade patterns:', error);
      throw error;
    }
  }

  // Analyze trading patterns
  analyzeTradePatterns(trades) {
    const patterns = {
      timeDistribution: {},
      sizeDistribution: {},
      tokenPreferences: {},
      strategyPatterns: [],
      riskPatterns: []
    };

    // Time distribution (hourly)
    trades.forEach(trade => {
      const hour = new Date(trade.executed_at).getHours();
      patterns.timeDistribution[hour] = (patterns.timeDistribution[hour] || 0) + 1;
    });

    // Size distribution
    const sizes = trades.map(trade => trade.amount * trade.price);
    const sizeBuckets = [0, 100, 1000, 10000, 100000, Infinity];
    sizeBuckets.forEach((bucket, index) => {
      if (index < sizeBuckets.length - 1) {
        const nextBucket = sizeBuckets[index + 1];
        patterns.sizeDistribution[`$${bucket}-${nextBucket === Infinity ? '+' : nextBucket}`] =
          sizes.filter(size => size >= bucket && size < nextBucket).length;
      }
    });

    // Token preferences
    const tokenStats = {};
    trades.forEach(trade => {
      if (!tokenStats[trade.token_mint]) {
        tokenStats[trade.token_mint] = { count: 0, volume: 0, pnl: 0 };
      }
      tokenStats[trade.token_mint].count++;
      tokenStats[trade.token_mint].volume += trade.amount * trade.price;
      tokenStats[trade.token_mint].pnl += trade.pnl || 0;
    });
    patterns.tokenPreferences = tokenStats;

    // Strategy patterns (simplified detection)
    const consecutiveTrades = this.findConsecutiveTrades(trades);
    if (consecutiveTrades.length > 0) {
      patterns.strategyPatterns.push({
        type: 'momentum_trading',
        description: `Detected ${consecutiveTrades.length} momentum-based trade sequences`,
        confidence: 0.8
      });
    }

    // Risk patterns
    const largeTrades = trades.filter(trade => trade.amount * trade.price > 10000);
    if (largeTrades.length > trades.length * 0.1) {
      patterns.riskPatterns.push({
        type: 'concentration_risk',
        description: 'High concentration of large trades detected',
        severity: 'medium'
      });
    }

    return patterns;
  }

  // Find consecutive trades in same direction
  findConsecutiveTrades(trades) {
    const sequences = [];
    let currentSequence = [];
    let lastDirection = null;

    trades.sort((a, b) => new Date(a.executed_at) - new Date(b.executed_at));

    trades.forEach(trade => {
      const direction = trade.side;

      if (direction === lastDirection && currentSequence.length > 0) {
        currentSequence.push(trade);
      } else {
        if (currentSequence.length >= 3) {
          sequences.push([...currentSequence]);
        }
        currentSequence = [trade];
      }

      lastDirection = direction;
    });

    if (currentSequence.length >= 3) {
      sequences.push(currentSequence);
    }

    return sequences;
  }

  // Get comparative analysis
  async getComparativeAnalysis(walletId, benchmarkWalletId, days = 30) {
    try {
      const [userStats, benchmarkStats] = await Promise.all([
        this.getTradeStatistics(walletId, days),
        this.getTradeStatistics(benchmarkWalletId, days)
      ]);

      return {
        userPerformance: userStats,
        benchmarkPerformance: benchmarkStats,
        comparison: {
          volumeDifference: ((userStats.totalVolume - benchmarkStats.totalVolume) / benchmarkStats.totalVolume) * 100,
          winRateDifference: userStats.winRate - benchmarkStats.winRate,
          pnlDifference: userStats.profitLoss - benchmarkStats.profitLoss,
          frequencyDifference: userStats.tradingFrequency - benchmarkStats.tradingFrequency
        }
      };
    } catch (error) {
      logger.error('Error getting comparative analysis:', error);
      throw error;
    }
  }

  // Export aggregated data
  async exportAggregatedData(walletId, format = 'json', days = 30) {
    try {
      const [statistics, patterns, timeframeData] = await Promise.all([
        this.getTradeStatistics(walletId, days),
        this.getTradePatterns(walletId, days),
        this.aggregateTradesByTimeframe(walletId, '1d', days)
      ]);

      const exportData = {
        walletId,
        period: { days, startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000), endDate: new Date() },
        statistics,
        patterns,
        timeframeData,
        generatedAt: new Date()
      };

      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }

      return exportData;
    } catch (error) {
      logger.error('Error exporting aggregated data:', error);
      throw error;
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    const csvRows = [];

    // Statistics
    csvRows.push('Statistics');
    csvRows.push('Metric,Value');
    Object.entries(data.statistics).forEach(([key, value]) => {
      csvRows.push(`${key},${value}`);
    });

    // Timeframe data
    csvRows.push('');
    csvRows.push('Timeframe Data');
    csvRows.push('Timestamp,Volume,Trade Count,Buy Volume,Sell Volume,Net Flow');
    data.timeframeData.forEach(row => {
      csvRows.push(`${row.timestamp},${row.volume},${row.tradeCount},${row.buyVolume},${row.sellVolume},${row.netFlow}`);
    });

    return csvRows.join('\n');
  }

  // Clear cache for wallet
  async clearCache(walletId) {
    try {
      const pattern = `trade_*:${walletId}:*`;
      const deleted = await cacheService.invalidatePattern(pattern);
      logger.info(`Cleared ${deleted} trade aggregation cache entries for wallet ${walletId}`);
      return deleted;
    } catch (error) {
      logger.error('Error clearing trade cache:', error);
      throw error;
    }
  }
}

module.exports = new TradeHistoryAggregationService();