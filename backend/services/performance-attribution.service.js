const { PnLModel } = require('../models/attribution.model');
const TradeModel = require('../models/trade.model');
const logger = require('../utils/logger');

class PerformanceAttributionService {
  // Calculate performance attribution
  async calculateAttribution(walletId, periodStart, periodEnd) {
    try {
      // Get trades for the period
      const trades = await TradeModel.getByWalletAndDateRange(walletId, periodStart, periodEnd);
      
      if (trades.length === 0) {
        return {
          total_return_percent: 0,
          benchmark_return_percent: 0,
          excess_return_percent: 0,
          strategy_contribution: {},
          asset_contribution: {},
          timing_contribution: {},
          volatility_contribution: 0,
          max_drawdown_contribution: 0
        };
      }

      // Calculate total return
      const totalReturn = trades.reduce((sum, trade) => sum + (trade.pnl_percent || 0), 0);
      
      // Group by strategy
      const strategyGroups = {};
      trades.forEach(trade => {
        const strategy = trade.strategy_type || 'unknown';
        if (!strategyGroups[strategy]) {
          strategyGroups[strategy] = { trades: [], pnl: 0 };
        }
        strategyGroups[strategy].trades.push(trade);
        strategyGroups[strategy].pnl += trade.pnl_usd || 0;
      });

      // Calculate strategy contributions
      const strategyContribution = {};
      Object.keys(strategyGroups).forEach(strategy => {
        const pnl = strategyGroups[strategy].pnl;
        strategyContribution[strategy] = {
          pnl_usd: pnl,
          pnl_percent: totalReturn > 0 ? (pnl / totalReturn) * 100 : 0,
          trade_count: strategyGroups[strategy].trades.length
        };
      });

      // Group by token
      const tokenGroups = {};
      trades.forEach(trade => {
        const token = trade.output_token_symbol || trade.output_token_mint;
        if (!tokenGroups[token]) {
          tokenGroups[token] = { trades: [], pnl: 0 };
        }
        tokenGroups[token].trades.push(trade);
        tokenGroups[token].pnl += trade.pnl_usd || 0;
      });

      // Calculate asset contributions
      const assetContribution = {};
      Object.keys(tokenGroups).forEach(token => {
        const pnl = tokenGroups[token].pnl;
        assetContribution[token] = {
          pnl_usd: pnl,
          pnl_percent: totalReturn > 0 ? (pnl / totalReturn) * 100 : 0,
          trade_count: tokenGroups[token].trades.length
        };
      });

      // Calculate timing contribution (simplified - market timing vs holding)
      const timingContribution = {
        market_timing: totalReturn * 0.1, // Placeholder calculation
        holding_period: totalReturn * 0.9
      };

      // Calculate risk metrics
      const returns = trades.map(trade => trade.pnl_percent || 0);
      const volatility = this.calculateVolatility(returns);
      const maxDrawdown = this.calculateMaxDrawdown(trades);

      return {
        total_return_percent: totalReturn,
        benchmark_return_percent: totalReturn * 0.8, // Simplified benchmark
        excess_return_percent: totalReturn * 0.2,
        strategy_contribution: strategyContribution,
        asset_contribution: assetContribution,
        timing_contribution: timingContribution,
        volatility_contribution: volatility,
        max_drawdown_contribution: maxDrawdown
      };
    } catch (error) {
      logger.error('Error calculating performance attribution:', error);
      throw error;
    }
  }

  // Record performance attribution
  async recordAttribution(walletId, periodStart, periodEnd) {
    try {
      const attribution = await this.calculateAttribution(walletId, periodStart, periodEnd);
      
      const record = await PnLModel.recordPerformanceAttribution({
        wallet_id: walletId,
        period_start: periodStart,
        period_end: periodEnd,
        ...attribution
      });

      logger.info(`Performance attribution recorded for wallet: ${walletId}`);
      return record;
    } catch (error) {
      logger.error('Error recording performance attribution:', error);
      throw error;
    }
  }

  // Get performance attribution
  async getAttribution(walletId, periodStart, periodEnd) {
    try {
      const attribution = await PnLModel.getPerformanceAttribution(walletId, periodStart, periodEnd);
      return attribution;
    } catch (error) {
      logger.error('Error fetching performance attribution:', error);
      throw error;
    }
  }

  // Calculate volatility (standard deviation of returns)
  calculateVolatility(returns) {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  // Calculate max drawdown
  calculateMaxDrawdown(trades) {
    if (trades.length === 0) return 0;

    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;

    for (const trade of trades) {
      cumulative += trade.pnl_usd || 0;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }
}

module.exports = new PerformanceAttributionService();