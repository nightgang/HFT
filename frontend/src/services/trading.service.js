/**
 * Trading service
 * Handles trading operations and market data
 */

import api from './api';

class TradingService {
  /**
   * Create a new trade
   */
  async createTrade(tradeData) {
    try {
      return await api.post('/trading/create', tradeData);
    } catch (error) {
      console.error('Failed to create trade:', error);
      throw error;
    }
  }

  /**
   * Get all trades
   */
  async getAllTrades(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.walletId) params.append('walletId', filters.walletId);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const endpoint = queryString ? `/trading/trades?${queryString}` : '/trading/trades';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
      throw error;
    }
  }

  /**
   * Get trade by ID
   */
  async getTradeById(tradeId) {
    try {
      return await api.get(`/trading/trades/${tradeId}`);
    } catch (error) {
      console.error('Failed to fetch trade:', error);
      throw error;
    }
  }

  /**
   * Cancel a trade
   */
  async cancelTrade(tradeId) {
    try {
      return await api.post(`/trading/trades/${tradeId}/cancel`, {});
    } catch (error) {
      console.error('Failed to cancel trade:', error);
      throw error;
    }
  }

  /**
   * Update trade
   */
  async updateTrade(tradeId, updates) {
    try {
      return await api.put(`/trading/trades/${tradeId}`, updates);
    } catch (error) {
      console.error('Failed to update trade:', error);
      throw error;
    }
  }

  /**
   * Execute trade
   */
  async executeTrade(tradeId) {
    try {
      return await api.post(`/trading/trades/${tradeId}/execute`, {});
    } catch (error) {
      console.error('Failed to execute trade:', error);
      throw error;
    }
  }

  /**
   * Get market data for token
   */
  async getMarketData(tokenMint) {
    try {
      return await api.get(`/trading/market/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      throw error;
    }
  }

  /**
   * Get TWAP (Time-Weighted Average Price)
   */
  async getTWAP(tokenMint, timewindow = 300) {
    try {
      return await api.get(`/trading/twap/${tokenMint}?window=${timewindow}`);
    } catch (error) {
      console.error('Failed to fetch TWAP:', error);
      throw error;
    }
  }

  /**
   * Get execution analytics
   */
  async getExecutionAnalytics(tradeId) {
    try {
      return await api.get(`/trading/analytics/${tradeId}`);
    } catch (error) {
      console.error('Failed to fetch execution analytics:', error);
      throw error;
    }
  }

  /**
   * Backtest strategy
   */
  async backtestStrategy(strategyData) {
    try {
      return await api.post('/trading/backtest', strategyData);
    } catch (error) {
      console.error('Failed to backtest strategy:', error);
      throw error;
    }
  }

  /**
   * Get portfolio correlation
   */
  async getPortfolioCorrelation() {
    try {
      return await api.get('/trading/portfolio/correlation');
    } catch (error) {
      console.error('Failed to fetch portfolio correlation:', error);
      throw error;
    }
  }

  /**
   * Create wallet
   */
  async createWallet(name, deterministic = false) {
    try {
      return await api.post('/trading/wallet/create', {
        name,
        deterministic,
      });
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  /**
   * Get trading stats
   */
  async getTradingStats() {
    try {
      return await api.get('/trading/stats');
    } catch (error) {
      console.error('Failed to fetch trading stats:', error);
      throw error;
    }
  }
}

export default new TradingService();
