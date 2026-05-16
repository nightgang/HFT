/**
 * Sniper service
 * Handles token sniping functionality
 */

import api from './api';

class SniperService {
  /**
   * Get sniper status
   */
  async getStatus() {
    try {
      return await api.get('/sniper/status');
    } catch (error) {
      console.error('Failed to fetch sniper status:', error);
      throw error;
    }
  }

  /**
   * Start sniper
   */
  async start(config) {
    try {
      return await api.post('/sniper/start', config);
    } catch (error) {
      console.error('Failed to start sniper:', error);
      throw error;
    }
  }

  /**
   * Stop sniper
   */
  async stop() {
    try {
      return await api.post('/sniper/stop', {});
    } catch (error) {
      console.error('Failed to stop sniper:', error);
      throw error;
    }
  }

  /**
   * Get sniper statistics
   */
  async getStats() {
    try {
      return await api.get('/sniper/stats');
    } catch (error) {
      console.error('Failed to fetch sniper stats:', error);
      throw error;
    }
  }

  /**
   * Get detected tokens
   */
  async getDetectedTokens(limit = 50) {
    try {
      return await api.get(`/sniper/tokens?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch detected tokens:', error);
      throw error;
    }
  }

  /**
   * Execute snipe
   */
  async executeSnipe(tokenMint) {
    try {
      return await api.post('/sniper/execute', { tokenMint });
    } catch (error) {
      console.error('Failed to execute snipe:', error);
      throw error;
    }
  }

  /**
   * Get snipe history
   */
  async getHistory(limit = 50, offset = 0) {
    try {
      return await api.get(`/sniper/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch snipe history:', error);
      throw error;
    }
  }

  /**
   * Configure sniper
   */
  async configure(config) {
    try {
      return await api.put('/sniper/config', config);
    } catch (error) {
      console.error('Failed to configure sniper:', error);
      throw error;
    }
  }
}

export default new SniperService();
