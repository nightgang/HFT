/**
 * Liquidity Pool service
 * Handles liquidity pool operations and management
 */

import api from './api';

class LiquidityPoolService {
  /**
   * Get all liquidity pools
   */
  async getAllPools(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.dex) params.append('dex', filters.dex);
      if (filters.chain) params.append('chain', filters.chain);
      if (filters.minLiquidity) params.append('minLiquidity', filters.minLiquidity);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const endpoint = queryString ? `/liquidity-pools?${queryString}` : '/liquidity-pools';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch liquidity pools:', error);
      throw error;
    }
  }

  /**
   * Get pool details
   */
  async getPoolDetails(poolId) {
    try {
      return await api.get(`/liquidity-pools/${poolId}`);
    } catch (error) {
      console.error('Failed to fetch pool details:', error);
      throw error;
    }
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(poolId) {
    try {
      return await api.get(`/liquidity-pools/${poolId}/stats`);
    } catch (error) {
      console.error('Failed to fetch pool stats:', error);
      throw error;
    }
  }

  /**
   * Add liquidity
   */
  async addLiquidity(poolId, liquidityData) {
    try {
      return await api.post(`/liquidity-pools/${poolId}/add`, liquidityData);
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      throw error;
    }
  }

  /**
   * Remove liquidity
   */
  async removeLiquidity(poolId, liquidityData) {
    try {
      return await api.post(`/liquidity-pools/${poolId}/remove`, liquidityData);
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
      throw error;
    }
  }

  /**
   * Get liquidity positions
   */
  async getLiquidityPositions(walletId) {
    try {
      return await api.get(`/liquidity-pools/positions?walletId=${walletId}`);
    } catch (error) {
      console.error('Failed to fetch liquidity positions:', error);
      throw error;
    }
  }

  /**
   * Get pool history
   */
  async getPoolHistory(poolId, limit = 50, offset = 0) {
    try {
      return await api.get(`/liquidity-pools/${poolId}/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch pool history:', error);
      throw error;
    }
  }

  /**
   * Get yield opportunities
   */
  async getYieldOpportunities() {
    try {
      return await api.get('/liquidity-pools/yield-opportunities');
    } catch (error) {
      console.error('Failed to fetch yield opportunities:', error);
      throw error;
    }
  }
}

export default new LiquidityPoolService();
