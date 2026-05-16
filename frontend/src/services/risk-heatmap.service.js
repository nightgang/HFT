/**
 * Risk Heatmap service
 * Handles risk assessment and visualization
 */

import api from './api';

class RiskHeatmapService {
  /**
   * Get portfolio risk heatmap
   */
  async getPortfolioRiskHeatmap() {
    try {
      return await api.get('/risk-heatmap/portfolio');
    } catch (error) {
      console.error('Failed to fetch portfolio risk heatmap:', error);
      throw error;
    }
  }

  /**
   * Get token risk heatmap
   */
  async getTokenRiskHeatmap() {
    try {
      return await api.get('/risk-heatmap/tokens');
    } catch (error) {
      console.error('Failed to fetch token risk heatmap:', error);
      throw error;
    }
  }

  /**
   * Get individual token risk
   */
  async getTokenRisk(tokenMint) {
    try {
      return await api.get(`/risk-heatmap/token/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch token risk:', error);
      throw error;
    }
  }

  /**
   * Get correlation heatmap
   */
  async getCorrelationHeatmap() {
    try {
      return await api.get('/risk-heatmap/correlation');
    } catch (error) {
      console.error('Failed to fetch correlation heatmap:', error);
      throw error;
    }
  }

  /**
   * Get volatility data
   */
  async getVolatility(tokenMint) {
    try {
      return await api.get(`/risk-heatmap/volatility/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch volatility data:', error);
      throw error;
    }
  }

  /**
   * Get Value at Risk (VaR)
   */
  async getValueAtRisk(timeframe = '1d') {
    try {
      return await api.get(`/risk-heatmap/var?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch Value at Risk:', error);
      throw error;
    }
  }

  /**
   * Get Conditional Value at Risk (CVaR)
   */
  async getConditionalValueAtRisk(timeframe = '1d') {
    try {
      return await api.get(`/risk-heatmap/cvar?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch Conditional Value at Risk:', error);
      throw error;
    }
  }

  /**
   * Get risk metrics
   */
  async getRiskMetrics() {
    try {
      return await api.get('/risk-heatmap/metrics');
    } catch (error) {
      console.error('Failed to fetch risk metrics:', error);
      throw error;
    }
  }
}

export default new RiskHeatmapService();
