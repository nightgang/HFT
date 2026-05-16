/**
 * Jito Bundle service
 * Handles Jito MEV bundle operations
 */

import api from './api';

class JitoBundleService {
  /**
   * Create a new Jito bundle
   */
  async createBundle(bundleData) {
    try {
      return await api.post('/jito-bundle/create', bundleData);
    } catch (error) {
      console.error('Failed to create Jito bundle:', error);
      throw error;
    }
  }

  /**
   * Get all bundles
   */
  async getAllBundles(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const endpoint = queryString ? `/jito-bundle?${queryString}` : '/jito-bundle';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch bundles:', error);
      throw error;
    }
  }

  /**
   * Get bundle by ID
   */
  async getBundleById(bundleId) {
    try {
      return await api.get(`/jito-bundle/${bundleId}`);
    } catch (error) {
      console.error('Failed to fetch bundle:', error);
      throw error;
    }
  }

  /**
   * Get bundle status
   */
  async getBundleStatus(bundleId) {
    try {
      return await api.get(`/jito-bundle/${bundleId}/status`);
    } catch (error) {
      console.error('Failed to fetch bundle status:', error);
      throw error;
    }
  }

  /**
   * Cancel bundle
   */
  async cancelBundle(bundleId) {
    try {
      return await api.post(`/jito-bundle/${bundleId}/cancel`, {});
    } catch (error) {
      console.error('Failed to cancel bundle:', error);
      throw error;
    }
  }

  /**
   * Get bundle statistics
   */
  async getStats() {
    try {
      return await api.get('/jito-bundle/stats');
    } catch (error) {
      console.error('Failed to fetch bundle stats:', error);
      throw error;
    }
  }

  /**
   * Get MEV statistics
   */
  async getMevStats() {
    try {
      return await api.get('/jito-bundle/mev-stats');
    } catch (error) {
      console.error('Failed to fetch MEV stats:', error);
      throw error;
    }
  }

  /**
   * Simulate bundle
   */
  async simulateBundle(bundleData) {
    try {
      return await api.post('/jito-bundle/simulate', bundleData);
    } catch (error) {
      console.error('Failed to simulate bundle:', error);
      throw error;
    }
  }
}

export default new JitoBundleService();
