const { query } = require('../db/connection');
const logger = require('../utils/logger');

class RiskHeatmapModel {
  // Record risk heatmap data
  static async recordRiskData(riskData) {
    const {
      wallet_id,
      token_mint,
      token_symbol,
      liquidity_risk,
      volatility_risk,
      impermanent_loss_risk,
      smart_money_risk,
      overall_risk_score,
      risk_factors,
      risk_trend,
      position_size_usd,
      position_age_days
    } = riskData;

    const sql = `
      INSERT INTO risk_heatmap (
        wallet_id, token_mint, token_symbol, liquidity_risk, volatility_risk,
        impermanent_loss_risk, smart_money_risk, overall_risk_score,
        risk_factors, risk_trend, position_size_usd, position_age_days
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      wallet_id, token_mint, token_symbol, liquidity_risk, volatility_risk,
      impermanent_loss_risk, smart_money_risk, overall_risk_score,
      JSON.stringify(risk_factors), risk_trend, position_size_usd, position_age_days
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Risk heatmap data recorded for ${token_symbol}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording risk heatmap data:', error);
      throw error;
    }
  }

  // Get risk heatmap for wallet
  static async getRiskHeatmap(wallet_id) {
    const sql = `
      SELECT * FROM risk_heatmap
      WHERE wallet_id = $1
      ORDER BY calculated_at DESC
      LIMIT 50
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching risk heatmap:', error);
      throw error;
    }
  }

  // Get risk score for specific token
  static async getTokenRisk(wallet_id, token_mint) {
    const sql = `
      SELECT * FROM risk_heatmap
      WHERE wallet_id = $1 AND token_mint = $2
      ORDER BY calculated_at DESC
      LIMIT 1
    `;
    try {
      const result = await query(sql, [wallet_id, token_mint]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching token risk:', error);
      throw error;
    }
  }

  // Get concentration heatmap
  static async getConcentrationHeatmap(wallet_id) {
    const sql = `
      SELECT * FROM position_concentration
      WHERE wallet_id = $1
      ORDER BY recorded_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching concentration heatmap:', error);
      throw error;
    }
  }

  // Get overconcentrated positions
  static async getOverconcentratedPositions(wallet_id) {
    const sql = `
      SELECT DISTINCT ON (token_mint) * FROM position_concentration
      WHERE wallet_id = $1 AND is_overconcentrated = true
      ORDER BY token_mint, recorded_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching overconcentrated positions:', error);
      throw error;
    }
  }
}

class CorrelationMatrixModel {
  // Record token correlation
  static async recordCorrelation(correlationData) {
    const {
      wallet_id,
      token_a_mint,
      token_a_symbol,
      token_b_mint,
      token_b_symbol,
      correlation_coefficient,
      period_days
    } = correlationData;

    let correlation_strength = 'weak';
    const absCorr = Math.abs(correlation_coefficient);
    if (absCorr > 0.7) correlation_strength = 'strong';
    else if (absCorr > 0.4) correlation_strength = 'moderate';

    const sql = `
      INSERT INTO correlation_matrix (
        wallet_id, token_a_mint, token_a_symbol, token_b_mint, token_b_symbol,
        correlation_coefficient, correlation_strength, period_days
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      wallet_id, token_a_mint, token_a_symbol, token_b_mint, token_b_symbol,
      correlation_coefficient, correlation_strength, period_days
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Correlation recorded between ${token_a_symbol} and ${token_b_symbol}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording correlation:', error);
      throw error;
    }
  }

  // Get correlation matrix for wallet
  static async getCorrelationMatrix(wallet_id, period_days = 30) {
    const sql = `
      SELECT * FROM correlation_matrix
      WHERE wallet_id = $1 AND period_days = $2
      AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'
      ORDER BY ABS(correlation_coefficient) DESC
    `;
    try {
      const result = await query(sql, [wallet_id, period_days]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching correlation matrix:', error);
      throw error;
    }
  }

  // Get highly correlated pairs (potential over-diversification)
  static async getHighlyCorrelatedPairs(wallet_id) {
    const sql = `
      SELECT * FROM correlation_matrix
      WHERE wallet_id = $1
      AND ABS(correlation_coefficient) > 0.7
      ORDER BY recorded_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching highly correlated pairs:', error);
      throw error;
    }
  }
}

module.exports = { RiskHeatmapModel, CorrelationMatrixModel };
