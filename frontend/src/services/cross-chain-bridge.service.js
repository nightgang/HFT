/**
 * Cross-Chain Bridge service
 * Handles cross-chain token bridging
 */

import api from './api';

class CrossChainBridgeService {
  /**
   * Get supported chains
   */
  async getSupportedChains() {
    try {
      return await api.get('/cross-chain/chains');
    } catch (error) {
      console.error('Failed to fetch supported chains:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens
   */
  async getSupportedTokens() {
    try {
      return await api.get('/cross-chain/tokens');
    } catch (error) {
      console.error('Failed to fetch supported tokens:', error);
      throw error;
    }
  }

  /**
   * Get bridge routes
   */
  async getBridgeRoutes(tokenMint, fromChain, toChain) {
    try {
      return await api.get(`/cross-chain/routes?token=${tokenMint}&from=${fromChain}&to=${toChain}`);
    } catch (error) {
      console.error('Failed to fetch bridge routes:', error);
      throw error;
    }
  }

  /**
   * Initiate bridge
   */
  async initiateBridge(bridgeData) {
    try {
      return await api.post('/cross-chain/bridge', bridgeData);
    } catch (error) {
      console.error('Failed to initiate bridge:', error);
      throw error;
    }
  }

  /**
   * Get bridge status
   */
  async getBridgeStatus(bridgeId) {
    try {
      return await api.get(`/cross-chain/bridge/${bridgeId}/status`);
    } catch (error) {
      console.error('Failed to fetch bridge status:', error);
      throw error;
    }
  }

  /**
   * Get bridge history
   */
  async getBridgeHistory(limit = 50, offset = 0) {
    try {
      return await api.get(`/cross-chain/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch bridge history:', error);
      throw error;
    }
  }

  /**
   * Get bridge fees
   */
  async getBridgeFees(tokenMint, fromChain, toChain, amount) {
    try {
      return await api.get(`/cross-chain/fees?token=${tokenMint}&from=${fromChain}&to=${toChain}&amount=${amount}`);
    } catch (error) {
      console.error('Failed to fetch bridge fees:', error);
      throw error;
    }
  }

  /**
   * Get bridge statistics
   */
  async getStatistics() {
    try {
      return await api.get('/cross-chain/stats');
    } catch (error) {
      console.error('Failed to fetch bridge statistics:', error);
      throw error;
    }
  }
}

export default new CrossChainBridgeService();
