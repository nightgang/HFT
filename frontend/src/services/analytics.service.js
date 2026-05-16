/**
 * Analytics service
 * Handles analytics and performance data
 */

import api from './api';

class AnalyticsService {
  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(timeframe = '1d') {
    try {
      return await api.get(`/analytics/performance?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch performance analytics:', error);
      throw error;
    }
  }

  /**
   * Get trade analytics
   */
  async getTradeAnalytics(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.timeframe) params.append('timeframe', filters.timeframe);
      if (filters.walletId) params.append('walletId', filters.walletId);

      const queryString = params.toString();
      const endpoint = queryString ? `/analytics/trades?${queryString}` : '/analytics/trades';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch trade analytics:', error);
      throw error;
    }
  }

  /**
   * Get returns analysis
   */
  async getReturnsAnalysis(timeframe = '1m') {
    try {
      return await api.get(`/analytics/returns?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch returns analysis:', error);
      throw error;
    }
  }

  /**
   * Get drawdown analysis
   */
  async getDrawdownAnalysis() {
    try {
      return await api.get('/analytics/drawdown');
    } catch (error) {
      console.error('Failed to fetch drawdown analysis:', error);
      throw error;
    }
  }

  /**
   * Get Sharpe ratio
   */
  async getSharpeRatio(timeframe = '1m') {
    try {
      return await api.get(`/analytics/sharpe-ratio?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch Sharpe ratio:', error);
      throw error;
    }
  }

  /**
   * Get win rate
   */
  async getWinRate() {
    try {
      return await api.get('/analytics/win-rate');
    } catch (error) {
      console.error('Failed to fetch win rate:', error);
      throw error;
    }
  }

  /**
   * Get performance attribution
   */
  async getPerformanceAttribution() {
    try {
      return await api.get('/analytics/performance-attribution');
    } catch (error) {
      console.error('Failed to fetch performance attribution:', error);
      throw error;
    }
  }

  /**
   * Export analytics report
   */
  async exportAnalyticsReport(format = 'pdf', timeframe = '1m') {
    try {
      return await api.get(`/analytics/export?format=${format}&timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to export analytics report:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
