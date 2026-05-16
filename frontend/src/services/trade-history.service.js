/**
 * Trade History service
 * Handles trade history tracking and analysis
 */

import api from './api';

class TradeHistoryService {
  /**
   * Get all trades
   */
  async getAllTrades(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.walletId) params.append('walletId', filters.walletId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const endpoint = queryString ? `/trade-history?${queryString}` : '/trade-history';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
      throw error;
    }
  }

  /**
   * Get trade by ID
   */
  async getTradeById(tradeId) {
    try {
      return await api.get(`/trade-history/${tradeId}`);
    } catch (error) {
      console.error('Failed to fetch trade:', error);
      throw error;
    }
  }

  /**
   * Get trade statistics
   */
  async getStatistics(timeframe = '1m') {
    try {
      return await api.get(`/trade-history/stats?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch trade statistics:', error);
      throw error;
    }
  }

  /**
   * Export trade history
   */
  async exportHistory(format = 'csv', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.walletId) params.append('walletId', filters.walletId);

      const queryString = params.toString();
      return await api.get(`/trade-history/export?${queryString}`);
    } catch (error) {
      console.error('Failed to export trade history:', error);
      throw error;
    }
  }

  /**
   * Get trading pairs
   */
  async getTradingPairs(limit = 100) {
    try {
      return await api.get(`/trade-history/pairs?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch trading pairs:', error);
      throw error;
    }
  }

  /**
   * Get P&L by pair
   */
  async getProfitLossByPair() {
    try {
      return await api.get('/trade-history/pnl-by-pair');
    } catch (error) {
      console.error('Failed to fetch P&L by pair:', error);
      throw error;
    }
  }

  /**
   * Get tax report
   */
  async getTaxReport(year) {
    try {
      return await api.get(`/trade-history/tax-report?year=${year}`);
    } catch (error) {
      console.error('Failed to fetch tax report:', error);
      throw error;
    }
  }
}

export default new TradeHistoryService();
