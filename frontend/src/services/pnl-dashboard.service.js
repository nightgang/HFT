/**
 * PnL Dashboard service
 * Handles P&L tracking and dashboard data
 */

import api from './api';

class PnLDashboardService {
  /**
   * Get overall P&L
   */
  async getOverallPnL() {
    try {
      return await api.get('/pnl/overall');
    } catch (error) {
      console.error('Failed to fetch overall P&L:', error);
      throw error;
    }
  }

  /**
   * Get P&L by timeframe
   */
  async getPnLByTimeframe(timeframe = '1d') {
    try {
      return await api.get(`/pnl/by-timeframe?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch P&L by timeframe:', error);
      throw error;
    }
  }

  /**
   * Get P&L by wallet
   */
  async getPnLByWallet(walletId) {
    try {
      return await api.get(`/pnl/wallet/${walletId}`);
    } catch (error) {
      console.error('Failed to fetch P&L by wallet:', error);
      throw error;
    }
  }

  /**
   * Get P&L by token
   */
  async getPnLByToken(tokenMint) {
    try {
      return await api.get(`/pnl/token/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch P&L by token:', error);
      throw error;
    }
  }

  /**
   * Get P&L chart data
   */
  async getChartData(timeframe = '1d') {
    try {
      return await api.get(`/pnl/chart?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch P&L chart data:', error);
      throw error;
    }
  }

  /**
   * Get realized P&L
   */
  async getRealizedPnL() {
    try {
      return await api.get('/pnl/realized');
    } catch (error) {
      console.error('Failed to fetch realized P&L:', error);
      throw error;
    }
  }

  /**
   * Get unrealized P&L
   */
  async getUnrealizedPnL() {
    try {
      return await api.get('/pnl/unrealized');
    } catch (error) {
      console.error('Failed to fetch unrealized P&L:', error);
      throw error;
    }
  }

  /**
   * Get daily P&L breakdown
   */
  async getDailyBreakdown(date) {
    try {
      return await api.get(`/pnl/daily-breakdown?date=${date}`);
    } catch (error) {
      console.error('Failed to fetch daily P&L breakdown:', error);
      throw error;
    }
  }
}

export default new PnLDashboardService();
