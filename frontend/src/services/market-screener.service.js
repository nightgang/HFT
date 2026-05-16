/**
 * Market Screener service
 * Handles market screening and token filtering
 */

import api from './api';

class MarketScreenerService {
  /**
   * Screen tokens
   */
  async screenTokens(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.minMarketCap) params.append('minMarketCap', filters.minMarketCap);
      if (filters.maxMarketCap) params.append('maxMarketCap', filters.maxMarketCap);
      if (filters.minVolume) params.append('minVolume', filters.minVolume);
      if (filters.minLiquidity) params.append('minLiquidity', filters.minLiquidity);
      if (filters.gainThreshold) params.append('gainThreshold', filters.gainThreshold);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString ? `/screener/tokens?${queryString}` : '/screener/tokens';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to screen tokens:', error);
      throw error;
    }
  }

  /**
   * Get token details
   */
  async getTokenDetails(tokenMint) {
    try {
      return await api.get(`/screener/tokens/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch token details:', error);
      throw error;
    }
  }

  /**
   * Get trending tokens
   */
  async getTrendingTokens(limit = 50) {
    try {
      return await api.get(`/screener/trending?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch trending tokens:', error);
      throw error;
    }
  }

  /**
   * Get top gainers
   */
  async getTopGainers(timeframe = '1h', limit = 50) {
    try {
      return await api.get(`/screener/gainers?timeframe=${timeframe}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch top gainers:', error);
      throw error;
    }
  }

  /**
   * Get top losers
   */
  async getTopLosers(timeframe = '1h', limit = 50) {
    try {
      return await api.get(`/screener/losers?timeframe=${timeframe}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch top losers:', error);
      throw error;
    }
  }

  /**
   * Save watchlist
   */
  async saveWatchlist(name, tokens) {
    try {
      return await api.post('/screener/watchlist', { name, tokens });
    } catch (error) {
      console.error('Failed to save watchlist:', error);
      throw error;
    }
  }

  /**
   * Get watchlists
   */
  async getWatchlists() {
    try {
      return await api.get('/screener/watchlists');
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
      throw error;
    }
  }

  /**
   * Get chart data
   */
  async getChartData(tokenMint, timeframe = '1h', limit = 100) {
    try {
      return await api.get(`/screener/chart/${tokenMint}?timeframe=${timeframe}&limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      throw error;
    }
  }
}

export default new MarketScreenerService();
