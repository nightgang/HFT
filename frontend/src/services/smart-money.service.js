/**
 * Smart Money service
 * Handles smart money tracking and smart contract interactions
 */

import api from './api';

class SmartMoneyService {
  /**
   * Get tracked smart wallets
   */
  async getTrackedWallets(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.chain) params.append('chain', filters.chain);
      if (filters.minBalance) params.append('minBalance', filters.minBalance);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString ? `/smart-money/wallets?${queryString}` : '/smart-money/wallets';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch smart wallets:', error);
      throw error;
    }
  }

  /**
   * Get wallet details
   */
  async getWalletDetails(walletAddress) {
    try {
      return await api.get(`/smart-money/wallets/${walletAddress}`);
    } catch (error) {
      console.error('Failed to fetch wallet details:', error);
      throw error;
    }
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(walletAddress, limit = 50, offset = 0) {
    try {
      return await api.get(`/smart-money/wallets/${walletAddress}/transactions?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch wallet transactions:', error);
      throw error;
    }
  }

  /**
   * Get smart money signals
   */
  async getSmartMoneySignals() {
    try {
      return await api.get('/smart-money/signals');
    } catch (error) {
      console.error('Failed to fetch smart money signals:', error);
      throw error;
    }
  }

  /**
   * Get token holdings by smart wallets
   */
  async getSmartWalletHoldings(tokenMint) {
    try {
      return await api.get(`/smart-money/holdings/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch smart wallet holdings:', error);
      throw error;
    }
  }

  /**
   * Follow wallet trades
   */
  async followWallet(walletAddress) {
    try {
      return await api.post(`/smart-money/follow/${walletAddress}`, {});
    } catch (error) {
      console.error('Failed to follow wallet:', error);
      throw error;
    }
  }

  /**
   * Unfollow wallet
   */
  async unfollowWallet(walletAddress) {
    try {
      return await api.post(`/smart-money/unfollow/${walletAddress}`, {});
    } catch (error) {
      console.error('Failed to unfollow wallet:', error);
      throw error;
    }
  }

  /**
   * Get followed wallets
   */
  async getFollowedWallets() {
    try {
      return await api.get('/smart-money/followed');
    } catch (error) {
      console.error('Failed to fetch followed wallets:', error);
      throw error;
    }
  }

  /**
   * Get smart money statistics
   */
  async getStatistics() {
    try {
      return await api.get('/smart-money/stats');
    } catch (error) {
      console.error('Failed to fetch smart money statistics:', error);
      throw error;
    }
  }
}

export default new SmartMoneyService();
