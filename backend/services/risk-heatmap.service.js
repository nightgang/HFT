const { RiskHeatmapModel, CorrelationMatrixModel } = require('../models/risk-heatmap.model');
const jupiterService = require('../integrations/jupiter.service');
const logger = require('../utils/logger');

class RiskHeatmapService {
  // Calculate and record risk heatmap for wallet positions
  async calculateRiskHeatmap(walletId, positions) {
    try {
      const riskData = [];

      for (const position of positions) {
        const riskMetrics = await this.calculateTokenRisk(position);
        
        const record = await RiskHeatmapModel.recordRiskData({
          wallet_id: walletId,
          token_mint: position.token_mint,
          token_symbol: position.token_symbol,
          ...riskMetrics
        });
        
        riskData.push(record);
      }

      logger.info(`Risk heatmap calculated for ${riskData.length} positions`);
      return riskData;
    } catch (error) {
      logger.error('Error calculating risk heatmap:', error);
      throw error;
    }
  }

  // Calculate risk metrics for a specific token
  async calculateTokenRisk(position) {
    try {
      const {
        token_mint,
        token_symbol,
        value_usd,
        quantity,
        avg_entry_price
      } = position;

      // Get current price
      const currentPrice = await this.getCurrentPrice(token_mint);
      
      // Calculate liquidity risk (simplified - based on position size vs typical liquidity)
      const liquidityRisk = Math.min((value_usd / 100000) * 20, 100); // Higher position = higher risk
      
      // Calculate volatility risk (placeholder - would use historical data)
      const volatilityRisk = Math.random() * 50 + 25; // 25-75 range
      
      // Calculate impermanent loss risk (for LP positions)
      const impermanentLossRisk = position.is_lp_position ? 
        Math.min(Math.abs(currentPrice - avg_entry_price) / avg_entry_price * 100, 100) : 0;
      
      // Calculate smart money risk (placeholder - whale activity)
      const smartMoneyRisk = Math.random() * 40 + 10; // 10-50 range
      
      // Calculate overall risk score
      const overallRiskScore = (liquidityRisk * 0.3 + volatilityRisk * 0.3 + 
                               impermanentLossRisk * 0.2 + smartMoneyRisk * 0.2);
      
      // Determine risk trend
      const riskTrend = overallRiskScore > 70 ? 'increasing' : 
                       overallRiskScore < 30 ? 'decreasing' : 'stable';
      
      // Calculate position age (placeholder)
      const positionAgeDays = Math.floor(Math.random() * 30) + 1;
      
      // Risk factors breakdown
      const riskFactors = {
        liquidity: liquidityRisk,
        volatility: volatilityRisk,
        impermanent_loss: impermanentLossRisk,
        smart_money: smartMoneyRisk
      };

      return {
        liquidity_risk: liquidityRisk,
        volatility_risk: volatilityRisk,
        impermanent_loss_risk: impermanentLossRisk,
        smart_money_risk: smartMoneyRisk,
        overall_risk_score: overallRiskScore,
        risk_factors: riskFactors,
        risk_trend: riskTrend,
        position_size_usd: value_usd,
        position_age_days: positionAgeDays
      };
    } catch (error) {
      logger.error(`Error calculating risk for ${position.token_symbol}:`, error);
      // Return default risk metrics
      return {
        liquidity_risk: 50,
        volatility_risk: 50,
        impermanent_loss_risk: 0,
        smart_money_risk: 50,
        overall_risk_score: 50,
        risk_factors: { liquidity: 50, volatility: 50, impermanent_loss: 0, smart_money: 50 },
        risk_trend: 'stable',
        position_size_usd: position.value_usd || 0,
        position_age_days: 1
      };
    }
  }

  // Get current price for a token
  async getCurrentPrice(tokenMint) {
    try {
      const priceData = await jupiterService.getTokenPrice(tokenMint);
      return priceData.price;
    } catch (error) {
      logger.error(`Error getting current price for ${tokenMint}:`, error);
      return 0;
    }
  }

  // Get risk heatmap for wallet
  async getRiskHeatmap(walletId) {
    try {
      const heatmap = await RiskHeatmapModel.getRiskHeatmap(walletId);
      return heatmap;
    } catch (error) {
      logger.error('Error fetching risk heatmap:', error);
      throw error;
    }
  }

  // Get risk score for specific token
  async getTokenRisk(walletId, tokenMint) {
    try {
      const risk = await RiskHeatmapModel.getTokenRisk(walletId, tokenMint);
      return risk;
    } catch (error) {
      logger.error('Error fetching token risk:', error);
      throw error;
    }
  }

  // Get risk alerts (high risk positions)
  async getRiskAlerts(walletId, threshold = 70) {
    try {
      const heatmap = await this.getRiskHeatmap(walletId);
      const alerts = heatmap.filter(item => item.overall_risk_score >= threshold);
      
      return alerts.map(item => ({
        token_symbol: item.token_symbol,
        risk_score: item.overall_risk_score,
        risk_factors: item.risk_factors,
        position_size_usd: item.position_size_usd,
        alert_level: item.overall_risk_score >= 90 ? 'critical' : 'high'
      }));
    } catch (error) {
      logger.error('Error fetching risk alerts:', error);
      throw error;
    }
  }

  // Get concentration heatmap
  async getConcentrationHeatmap(walletId) {
    try {
      const heatmap = await RiskHeatmapModel.getConcentrationHeatmap(walletId);
      return heatmap;
    } catch (error) {
      logger.error('Error fetching concentration heatmap:', error);
      throw error;
    }
  }

  // Get overconcentrated positions (risk warning)
  async getOverconcentratedPositions(walletId) {
    try {
      const positions = await RiskHeatmapModel.getOverconcentratedPositions(walletId);
      return positions;
    } catch (error) {
      logger.error('Error fetching overconcentrated positions:', error);
      throw error;
    }
  }
}

class CorrelationAnalysisService {
  // Analyze token correlations
  async analyzeCorrelations(walletId, positions, periodDays = 30) {
    try {
      const correlations = [];

      // For each pair of tokens, calculate correlation
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const tokenA = positions[i];
          const tokenB = positions[j];

          // Calculate correlation coefficient (would use historical price data)
          const correlation = await this.calculateCorrelationCoefficient(
            tokenA.token_mint,
            tokenB.token_mint,
            periodDays
          );

          const record = await CorrelationMatrixModel.recordCorrelation({
            wallet_id: walletId,
            token_a_mint: tokenA.token_mint,
            token_a_symbol: tokenA.token_symbol,
            token_b_mint: tokenB.token_mint,
            token_b_symbol: tokenB.token_symbol,
            correlation_coefficient: correlation,
            period_days: periodDays
          });

          correlations.push(record);
        }
      }

      logger.info(`Correlation analysis completed: ${correlations.length} pairs`);
      return correlations;
    } catch (error) {
      logger.error('Error analyzing correlations:', error);
      throw error;
    }
  }

  // Get correlation matrix
  async getCorrelationMatrix(walletId, periodDays = 30) {
    try {
      const matrix = await CorrelationMatrixModel.getCorrelationMatrix(walletId, periodDays);
      return matrix;
    } catch (error) {
      logger.error('Error fetching correlation matrix:', error);
      throw error;
    }
  }

  // Identify portfolio diversification issues
  async getDiversificationIssues(walletId) {
    try {
      const highlyCorrelated = await CorrelationMatrixModel.getHighlyCorrelatedPairs(walletId);
      
      // Group correlated pairs
      const issueGroups = this.groupCorrelatedAssets(highlyCorrelated);
      
      return {
        issue_count: issueGroups.length,
        issues: issueGroups,
        recommendation: 'Consider rebalancing to reduce portfolio correlation'
      };
    } catch (error) {
      logger.error('Error fetching diversification issues:', error);
      throw error;
    }
  }

  // Group correlated assets
  groupCorrelatedAssets(correlations) {
    const groups = {};
    
    correlations.forEach(corr => {
      const key = `${Math.min(corr.token_a_mint, corr.token_b_mint)}-${Math.max(corr.token_a_mint, corr.token_b_mint)}`;
      if (!groups[key]) {
        groups[key] = {
          tokens: [corr.token_a_symbol, corr.token_b_symbol],
          correlation: corr.correlation_coefficient,
          strength: corr.correlation_strength
        };
      }
    });

    return Object.values(groups);
  }

  // Mock: Calculate correlation coefficient
  async calculateCorrelationCoefficient(tokenA, tokenB, days) {
    // Would use real historical price data
    return Math.random() * 2 - 1; // Random between -1 and 1
  }
}

module.exports = { RiskHeatmapService: new RiskHeatmapService(), CorrelationAnalysisService: new CorrelationAnalysisService() };
