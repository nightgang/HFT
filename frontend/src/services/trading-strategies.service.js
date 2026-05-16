/**
 * Trading Strategies service
 * Handles trading strategy management and execution
 */

import api from './api';

class TradingStrategiesService {
  /**
   * Get all strategies
   */
  async getAllStrategies(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString ? `/trading-strategies?${queryString}` : '/trading-strategies';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
      throw error;
    }
  }

  /**
   * Get strategy by ID
   */
  async getStrategyById(strategyId) {
    try {
      return await api.get(`/trading-strategies/${strategyId}`);
    } catch (error) {
      console.error('Failed to fetch strategy:', error);
      throw error;
    }
  }

  /**
   * Create strategy
   */
  async createStrategy(strategyData) {
    try {
      return await api.post('/trading-strategies', strategyData);
    } catch (error) {
      console.error('Failed to create strategy:', error);
      throw error;
    }
  }

  /**
   * Update strategy
   */
  async updateStrategy(strategyId, updates) {
    try {
      return await api.put(`/trading-strategies/${strategyId}`, updates);
    } catch (error) {
      console.error('Failed to update strategy:', error);
      throw error;
    }
  }

  /**
   * Delete strategy
   */
  async deleteStrategy(strategyId) {
    try {
      return await api.delete(`/trading-strategies/${strategyId}`);
    } catch (error) {
      console.error('Failed to delete strategy:', error);
      throw error;
    }
  }

  /**
   * Activate strategy
   */
  async activateStrategy(strategyId) {
    try {
      return await api.post(`/trading-strategies/${strategyId}/activate`, {});
    } catch (error) {
      console.error('Failed to activate strategy:', error);
      throw error;
    }
  }

  /**
   * Deactivate strategy
   */
  async deactivateStrategy(strategyId) {
    try {
      return await api.post(`/trading-strategies/${strategyId}/deactivate`, {});
    } catch (error) {
      console.error('Failed to deactivate strategy:', error);
      throw error;
    }
  }

  /**
   * Get strategy performance
   */
  async getStrategyPerformance(strategyId) {
    try {
      return await api.get(`/trading-strategies/${strategyId}/performance`);
    } catch (error) {
      console.error('Failed to fetch strategy performance:', error);
      throw error;
    }
  }

  /**
   * Backtest strategy
   */
  async backtestStrategy(strategyData) {
    try {
      return await api.post('/trading-strategies/backtest', strategyData);
    } catch (error) {
      console.error('Failed to backtest strategy:', error);
      throw error;
    }
  }

  /**
   * Clone strategy
   */
  async cloneStrategy(strategyId) {
    try {
      return await api.post(`/trading-strategies/${strategyId}/clone`, {});
    } catch (error) {
      console.error('Failed to clone strategy:', error);
      throw error;
    }
  }
}

export default new TradingStrategiesService();
