// Portfolio Tracker Service
// Real-time portfolio tracking, performance analytics, and rebalancing suggestions

const logger = require('../utils/logger');
const { query } = require('../db/connection');

class PortfolioTrackerService {
  constructor() {
    this.portfolioCache = new Map();
    this.cacheTTL = 60000; // 1 minute
    this.rebalanceThreshold = 0.1; // 10% deviation
  }

  /**
   * Get portfolio summary for wallet
   */
  async getPortfolioSummary(walletId) {
    try {
      const cacheKey = `portfolio_${walletId}`;
      const cached = this.portfolioCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      // Get all holdings
      const holdings = await query(
        `SELECT 
          wb.token_mint, 
          wb.token_symbol,
          wb.balance,
          wb.recorded_at,
          t.current_price_usd,
          t.market_cap_usd
        FROM wallet_balances wb
        LEFT JOIN token_metadata t ON wb.token_mint = t.token_mint
        WHERE wb.wallet_id = $1
        ORDER BY wb.balance DESC`,
        [walletId]
      );

      // Calculate portfolio metrics
      let totalValueUsd = 0;
      const positions = [];

      for (const holding of holdings.rows) {
        const valueUsd = (holding.balance * (holding.current_price_usd || 0));
        totalValueUsd += valueUsd;

        positions.push({
          tokenMint: holding.token_mint,
          tokenSymbol: holding.token_symbol,
          balance: holding.balance,
          valueUsd: valueUsd,
          percentOfPortfolio: 0, // Calculate after total
          marketCapUsd: holding.market_cap_usd
        });
      }

      // Calculate percentages
      positions.forEach(p => {
        p.percentOfPortfolio = totalValueUsd > 0 ? (p.valueUsd / totalValueUsd) * 100 : 0;
      });

      // Get performance metrics
      const performance = await this.calculatePerformance(walletId);

      const summary = {
        walletId,
        totalValueUsd,
        positionCount: positions.length,
        positions,
        performance,
        lastUpdated: new Date(),
        rebalancingNeeded: this.checkRebalancingNeeded(positions)
      };

      this.portfolioCache.set(cacheKey, {
        data: summary,
        timestamp: Date.now()
      });

      return summary;
    } catch (error) {
      logger.error('Error getting portfolio summary', error);
      throw error;
    }
  }

  /**
   * Calculate portfolio performance
   */
  async calculatePerformance(walletId) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await query(
        `SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_trades,
          AVG(slippage_percent) as avg_slippage,
          SUM(CASE WHEN actual_output_amount > expected_output_amount THEN 1 ELSE 0 END) as profitable_trades
        FROM trades
        WHERE wallet_id = $1
        AND created_at > $2`,
        [walletId, thirtyDaysAgo]
      );

      const metrics = result.rows[0] || {};

      return {
        trades30d: parseInt(metrics.total_trades || 0),
        successfulTrades: parseInt(metrics.successful_trades || 0),
        profitableTradesPercent: metrics.total_trades > 0 
          ? (parseInt(metrics.profitable_trades || 0) / parseInt(metrics.total_trades)) * 100 
          : 0,
        avgSlippage: parseFloat(metrics.avg_slippage || 0),
        winRate: metrics.total_trades > 0 
          ? (parseInt(metrics.successful_trades || 0) / parseInt(metrics.total_trades)) * 100
          : 0
      };
    } catch (error) {
      logger.error('Error calculating performance', error);
      return {};
    }
  }

  /**
   * Check if portfolio needs rebalancing
   */
  checkRebalancingNeeded(positions) {
    if (positions.length === 0) return false;

    // Check for positions that deviate significantly from target
    const targetAllocation = 100 / positions.length;

    for (const position of positions) {
      const deviation = Math.abs(position.percentOfPortfolio - targetAllocation);
      if (deviation > this.rebalanceThreshold * 100) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get rebalancing recommendations
   */
  async getRebalancingRecommendations(walletId) {
    try {
      const portfolio = await this.getPortfolioSummary(walletId);
      
      if (!portfolio.rebalancingNeeded) {
        return { recommendation: 'no_rebalancing_needed', positions: [] };
      }

      const targetAllocation = 100 / portfolio.positions.length;
      const recommendations = [];

      for (const position of portfolio.positions) {
        const deviation = position.percentOfPortfolio - targetAllocation;
        const deviationAbs = Math.abs(deviation);

        if (deviationAbs > this.rebalanceThreshold * 100) {
          recommendations.push({
            tokenMint: position.tokenMint,
            tokenSymbol: position.tokenSymbol,
            currentAllocation: position.percentOfPortfolio,
            targetAllocation,
            action: deviation > 0 ? 'sell' : 'buy',
            deviationPercent: deviation,
            reason: deviation > 0 
              ? `Position is ${deviationAbs.toFixed(1)}% above target allocation`
              : `Position is ${deviationAbs.toFixed(1)}% below target allocation`
          });
        }
      }

      return {
        recommendation: 'rebalance',
        reasons: [
          'Portfolio has drifted from target allocations',
          'Rebalancing can help manage risk'
        ],
        actions: recommendations,
        totalValueUsd: portfolio.totalValueUsd
      };
    } catch (error) {
      logger.error('Error getting rebalancing recommendations', error);
      throw error;
    }
  }

  /**
   * Get portfolio allocation chart data
   */
  async getPortfolioAllocation(walletId) {
    try {
      const portfolio = await this.getPortfolioSummary(walletId);

      return {
        labels: portfolio.positions.map(p => p.tokenSymbol),
        data: portfolio.positions.map(p => p.percentOfPortfolio),
        totalValue: portfolio.totalValueUsd,
        positions: portfolio.positions
      };
    } catch (error) {
      logger.error('Error getting portfolio allocation', error);
      throw error;
    }
  }

  /**
   * Get portfolio value over time
   */
  async getPortfolioHistory(walletId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await query(
        `SELECT 
          DATE(recorded_at) as date,
          SUM(balance * COALESCE(current_price_usd, 0)) as portfolio_value_usd
        FROM wallet_balances wb
        LEFT JOIN token_metadata tm ON wb.token_mint = tm.token_mint
        WHERE wb.wallet_id = $1
        AND wb.recorded_at >= $2
        GROUP BY DATE(recorded_at)
        ORDER BY date ASC`,
        [walletId, startDate]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting portfolio history', error);
      throw error;
    }
  }

  /**
   * Get correlation analysis between portfolio holdings
   */
  async getCorrelationAnalysis(walletId) {
    try {
      const portfolio = await this.getPortfolioSummary(walletId);

      // TODO: Implement correlation calculation
      // For now, return placeholder
      return {
        analyzed: portfolio.positions.length,
        correlations: [],
        note: 'Correlation analysis to be implemented'
      };
    } catch (error) {
      logger.error('Error getting correlation analysis', error);
      throw error;
    }
  }

  /**
   * Clear cache for wallet
   */
  clearCache(walletId) {
    const cacheKey = `portfolio_${walletId}`;
    this.portfolioCache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.portfolioCache.clear();
  }
}

module.exports = new PortfolioTrackerService();
