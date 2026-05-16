/**
 * Portfolio service
 * Handles portfolio tracking and management
 */

import api from './api';

class PortfolioService {
  /**
   * Get portfolio overview
   */
  async getPortfolioOverview() {
    try {
      return await api.get('/portfolio');
    } catch (error) {
      console.error('Failed to fetch portfolio overview:', error);
      throw error;
    }
  }

  /**
   * Get portfolio holdings
   */
  async getHoldings(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.walletId) params.append('walletId', filters.walletId);
      if (filters.chain) params.append('chain', filters.chain);

      const queryString = params.toString();
      const endpoint = queryString ? `/portfolio/holdings?${queryString}` : '/portfolio/holdings';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch holdings:', error);
      throw error;
    }
  }

  /**
   * Get portfolio allocation
   */
  async getAllocation() {
    try {
      return await api.get('/portfolio/allocation');
    } catch (error) {
      console.error('Failed to fetch portfolio allocation:', error);
      throw error;
    }
  }

  /**
   * Get portfolio performance
   */
  async getPerformance(timeframe = '1d') {
    try {
      return await api.get(`/portfolio/performance?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch portfolio performance:', error);
      throw error;
    }
  }

  /**
   * Get portfolio history
   */
  async getHistory(limit = 100, offset = 0) {
    try {
      return await api.get(`/portfolio/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch portfolio history:', error);
      throw error;
    }
  }

  /**
   * Rebalance portfolio
   */
  async rebalancePortfolio(targetAllocation) {
    try {
      return await api.post('/portfolio/rebalance', {
        targetAllocation,
      });
    } catch (error) {
      console.error('Failed to rebalance portfolio:', error);
      throw error;
    }
  }

  /**
   * Get risk metrics
   */
  async getRiskMetrics() {
    try {
      return await api.get('/portfolio/risk-metrics');
    } catch (error) {
      console.error('Failed to fetch risk metrics:', error);
      throw error;
    }
  }

  /**
   * Export portfolio
   */
  async exportPortfolio(format = 'csv') {
    try {
      return await api.get(`/portfolio/export?format=${format}`);
    } catch (error) {
      console.error('Failed to export portfolio:', error);
      throw error;
    }
  }
}

export default new PortfolioService();
