/**
 * Arbitrage service
 * Handles arbitrage trading opportunities
 */

import api from './api';

class ArbitrageService {
  /**
   * Get arbitrage opportunities
   */
  async getOpportunities(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.minProfit) params.append('minProfit', filters.minProfit);
      if (filters.dexes) params.append('dexes', filters.dexes);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString ? `/arbitrage/opportunities?${queryString}` : '/arbitrage/opportunities';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch arbitrage opportunities:', error);
      throw error;
    }
  }

  /**
   * Execute arbitrage trade
   */
  async executeTrade(opportunityId) {
    try {
      return await api.post(`/arbitrage/execute/${opportunityId}`, {});
    } catch (error) {
      console.error('Failed to execute arbitrage trade:', error);
      throw error;
    }
  }

  /**
   * Get arbitrage history
   */
  async getHistory(limit = 50, offset = 0) {
    try {
      return await api.get(`/arbitrage/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch arbitrage history:', error);
      throw error;
    }
  }

  /**
   * Get arbitrage statistics
   */
  async getStats() {
    try {
      return await api.get('/arbitrage/stats');
    } catch (error) {
      console.error('Failed to fetch arbitrage stats:', error);
      throw error;
    }
  }

  /**
   * Configure arbitrage bot
   */
  async configure(config) {
    try {
      return await api.put('/arbitrage/config', config);
    } catch (error) {
      console.error('Failed to configure arbitrage bot:', error);
      throw error;
    }
  }

  /**
   * Get arbitrage bot status
   */
  async getStatus() {
    try {
      return await api.get('/arbitrage/status');
    } catch (error) {
      console.error('Failed to fetch arbitrage status:', error);
      throw error;
    }
  }

  /**
   * Start arbitrage bot
   */
  async start(config) {
    try {
      return await api.post('/arbitrage/start', config);
    } catch (error) {
      console.error('Failed to start arbitrage bot:', error);
      throw error;
    }
  }

  /**
   * Stop arbitrage bot
   */
  async stop() {
    try {
      return await api.post('/arbitrage/stop', {});
    } catch (error) {
      console.error('Failed to stop arbitrage bot:', error);
      throw error;
    }
  }
}

export default new ArbitrageService();
