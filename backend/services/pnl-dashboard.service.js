const { PnLModel, StrategyPerformanceModel, TokenAttributionModel } = require('../models/attribution.model');
const TradeModel = require('../models/trade.model');
const logger = require('../utils/logger');

class PnLDashboardService {
  // Record a P&L snapshot
  async recordPnLSnapshot(walletId, snapshotData) {
    try {
      const snapshot = await PnLModel.recordSnapshot({
        wallet_id: walletId,
        ...snapshotData
      });
      logger.info(`P&L snapshot recorded for wallet: ${walletId}`);
      return snapshot;
    } catch (error) {
      logger.error('Error recording P&L snapshot:', error);
      throw error;
    }
  }

  // Calculate P&L for wallet (real-time)
  async calculateCurrentPnL(walletId) {
    try {
      // Get all trades for the wallet
      const trades = await TradeModel.getByWallet(walletId);
      
      let realizedPnL = 0;
      let unrealizedPnL = 0;
      let totalInvested = 0;

      // Calculate realized and unrealized P&L
      const positions = {};
      
      trades.forEach(trade => {
        const key = trade.output_token_mint;
        
        if (trade.status === 'confirmed') {
          if (trade.direction === 'buy') {
            if (!positions[key]) {
              positions[key] = { quantity: 0, avgCost: 0 };
            }
            const costBasis = trade.actual_output_amount * trade.actual_price;
            positions[key].avgCost = (positions[key].avgCost * positions[key].quantity + costBasis) / 
                                     (positions[key].quantity + trade.actual_output_amount);
            positions[key].quantity += trade.actual_output_amount;
            totalInvested += costBasis;
          } else if (trade.direction === 'sell') {
            if (positions[key]) {
              const saleProceeds = trade.actual_output_amount * trade.actual_price;
              const costBasis = positions[key].quantity * positions[key].avgCost;
              realizedPnL += saleProceeds - costBasis;
              positions[key].quantity = Math.max(0, positions[key].quantity - trade.actual_output_amount);
            }
          }
        }
        
        if (trade.pnl_usd) {
          realizedPnL += parseFloat(trade.pnl_usd);
        }
      });

      // Get current prices for unrealized P&L
      let currentPortfolioValue = 0;
      for (const [tokenMint, position] of Object.entries(positions)) {
        if (position.quantity > 0) {
          const currentPrice = await this.getCurrentPrice(tokenMint);
          const positionValue = position.quantity * currentPrice;
          currentPortfolioValue += positionValue;
          unrealizedPnL += positionValue - (position.quantity * position.avgCost);
        }
      }

      const totalPnL = realizedPnL + unrealizedPnL;
      const totalPortfolioValue = currentPortfolioValue + totalInvested - realizedPnL;

      return {
        realized_pnl_usd: realizedPnL,
        unrealized_pnl_usd: unrealizedPnL,
        total_pnl_usd: totalPnL,
        realized_pnl_percent: totalInvested > 0 ? (realizedPnL / totalInvested) * 100 : 0,
        unrealized_pnl_percent: totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0,
        total_portfolio_value_usd: totalPortfolioValue,
        total_invested_usd: totalInvested
      };
    } catch (error) {
      logger.error('Error calculating P&L:', error);
      throw error;
    }
  }

  // Get P&L dashboard data
  async getDashboard(walletId) {
    try {
      const snapshots = await PnLModel.getDashboardSnapshots(walletId);
      const current = await this.calculateCurrentPnL(walletId);

      return {
        current: current,
        snapshots: snapshots,
        updated_at: new Date()
      };
    } catch (error) {
      logger.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  // Get P&L history
  async getPnLHistory(walletId, startDate, endDate) {
    try {
      const history = await PnLModel.getSnapshotHistory(walletId, startDate, endDate);
      return history;
    } catch (error) {
      logger.error('Error fetching P&L history:', error);
      throw error;
    }
  }

  // Mock: Get current price
  async getCurrentPrice(tokenMint) {
    // Would integrate with actual price feed
    return 150.5;
  }
}

class PerformanceAttributionService {
  // Record strategy performance
  async recordStrategyPerformance(walletId, strategyName, performanceData) {
    try {
      const performance = await StrategyPerformanceModel.recordPerformance({
        wallet_id: walletId,
        strategy_name: strategyName,
        ...performanceData
      });
      logger.info(`Strategy performance recorded: ${strategyName}`);
      return performance;
    } catch (error) {
      logger.error('Error recording strategy performance:', error);
      throw error;
    }
  }

  // Get strategy attribution
  async getStrategyAttribution(walletId, periodStart, periodEnd) {
    try {
      const attribution = await StrategyPerformanceModel.getStrategyAttribution(
        walletId, periodStart, periodEnd
      );
      
      // Calculate total P&L and percentages
      const totalPnL = attribution.reduce((sum, s) => sum + (s.strategy_pnl_usd || 0), 0);
      
      const enhanced = attribution.map(strategy => ({
        ...strategy,
        pnl_contribution_percent: totalPnL !== 0 ? (strategy.strategy_pnl_usd / totalPnL) * 100 : 0
      }));

      return enhanced;
    } catch (error) {
      logger.error('Error fetching strategy attribution:', error);
      throw error;
    }
  }
}

class TokenAttributionService {
  // Record token attribution
  async recordTokenAttribution(walletId, tokenData) {
    try {
      const attribution = await TokenAttributionModel.recordAttribution({
        wallet_id: walletId,
        ...tokenData
      });
      logger.info(`Token attribution recorded: ${tokenData.token_symbol}`);
      return attribution;
    } catch (error) {
      logger.error('Error recording token attribution:', error);
      throw error;
    }
  }

  // Get token attribution
  async getTokenAttribution(walletId, periodStart, periodEnd) {
    try {
      const attribution = await TokenAttributionModel.getTokenAttribution(
        walletId, periodStart, periodEnd
      );
      
      const totalPnL = attribution.reduce((sum, t) => sum + (t.token_pnl_usd || 0), 0);
      
      const enhanced = attribution.map(token => ({
        ...token,
        pnl_contribution_percent: totalPnL !== 0 ? (token.token_pnl_usd / totalPnL) * 100 : 0
      }));

      return enhanced;
    } catch (error) {
      logger.error('Error fetching token attribution:', error);
      throw error;
    }
  }
}

module.exports = { PnLDashboardService: new PnLDashboardService(), PerformanceAttributionService: new PerformanceAttributionService(), TokenAttributionService: new TokenAttributionService() };
