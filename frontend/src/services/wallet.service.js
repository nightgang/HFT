/**
 * Wallet service
 * Handles wallet management and operations
 */

import api from './api';

class WalletService {
  /**
   * Get all wallets
   */
  async getAllWallets(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.active !== undefined) params.append('active', filters.active);

      const queryString = params.toString();
      const endpoint = queryString ? `/wallets?${queryString}` : '/wallets';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
      throw error;
    }
  }

  /**
   * Get wallet by ID
   */
  async getWalletById(walletId) {
    try {
      return await api.get(`/wallets/${walletId}`);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      throw error;
    }
  }

  /**
   * Create a new wallet
   */
  async createWallet(name, description = '', walletType = 'standard') {
    try {
      return await api.post('/wallets', {
        name,
        description,
        walletType,
      });
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  /**
   * Import a wallet
   */
  async importWallet(name, privateKey, description = '') {
    try {
      return await api.post('/wallets/import', {
        name,
        privateKey,
        description,
      });
    } catch (error) {
      console.error('Failed to import wallet:', error);
      throw error;
    }
  }

  /**
   * Connect external wallet
   */
  async connectWallet(publicKey, walletType = 'phantom') {
    try {
      return await api.post('/wallets/connect', {
        publicKey,
        walletType,
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Update wallet
   */
  async updateWallet(walletId, updates) {
    try {
      return await api.put(`/wallets/${walletId}`, updates);
    } catch (error) {
      console.error('Failed to update wallet:', error);
      throw error;
    }
  }

  /**
   * Delete wallet
   */
  async deleteWallet(walletId) {
    try {
      return await api.delete(`/wallets/${walletId}`);
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId) {
    try {
      return await api.get(`/wallets/${walletId}/balance`);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get wallet history/transactions
   */
  async getWalletHistory(walletId, limit = 50, offset = 0) {
    try {
      return await api.get(`/wallets/${walletId}/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch wallet history:', error);
      throw error;
    }
  }

  /**
   * Set wallet as active
   */
  async setActiveWallet(walletId) {
    try {
      return await api.put(`/wallets/${walletId}/set-active`, {});
    } catch (error) {
      console.error('Failed to set active wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet details
   */
  async getWalletDetails(walletId) {
    try {
      return await api.get(`/wallets/${walletId}/details`);
    } catch (error) {
      console.error('Failed to fetch wallet details:', error);
      throw error;
    }
  }
}

export default new WalletService();
