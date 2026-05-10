const { RiskHeatmapModel, CorrelationMatrixModel } = require('../models/risk-heatmap.model');
const logger = require('../utils/logger');

class RiskHeatmapService {
  // Analyze position concentration
  async analyzeConcentration(walletId, positions) {
    try {
      const records = [];
      let totalPortfolioUSD = 0;

      // Calculate total portfolio value
      totalPortfolioUSD = positions.reduce((sum, p) => sum + (p.value_usd || 0), 0);

      // Record concentration for each position
      for (const position of positions) {
        const weight = totalPortfolioUSD > 0 ? (position.value_usd / totalPortfolioUSD) * 100 : 0;
        const score = this.calculateConcentrationScore(weight, position.volatility);

        const record = await RiskHeatmapModel.recordConcentration({
          wallet_id: walletId,
          token_mint: position.token_mint,
          token_symbol: position.token_symbol,
          position_size_usd: position.value_usd,
          portfolio_weight_percent: weight,
          concentration_score: score,
          risk_level: this.getRiskLevel(score)
        });
        records.push(record);
      }

      logger.info(`Concentration analysis completed for ${records.length} positions`);
      return records;
    } catch (error) {
      logger.error('Error analyzing concentration:', error);
      throw error;
    }
  }

  // Calculate concentration score (0-100)
  calculateConcentrationScore(weight, volatility = 1.0) {
    const baseScore = Math.min(weight * 2, 100);
    const volatilityMultiplier = 1 + (volatility - 1) * 0.5;
    return Math.min(baseScore * volatilityMultiplier, 100);
  }

  // Determine risk level
  getRiskLevel(score) {
    if (score < 30) return 'low';
    if (score < 70) return 'medium';
    return 'high';
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
