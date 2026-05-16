/**
 * Advanced Orders service
 * Handles advanced order types and management
 */

import api from './api';

class AdvancedOrdersService {
  /**
   * Create advanced order
   */
  async createAdvancedOrder(orderData) {
    try {
      return await api.post('/advanced-orders/create', orderData);
    } catch (error) {
      console.error('Failed to create advanced order:', error);
      throw error;
    }
  }

  /**
   * Get all advanced orders
   */
  async getAllAdvancedOrders(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString ? `/advanced-orders?${queryString}` : '/advanced-orders';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch advanced orders:', error);
      throw error;
    }
  }

  /**
   * Get advanced order by ID
   */
  async getAdvancedOrderById(orderId) {
    try {
      return await api.get(`/advanced-orders/${orderId}`);
    } catch (error) {
      console.error('Failed to fetch advanced order:', error);
      throw error;
    }
  }

  /**
   * Cancel advanced order
   */
  async cancelAdvancedOrder(orderId) {
    try {
      return await api.post(`/advanced-orders/${orderId}/cancel`, {});
    } catch (error) {
      console.error('Failed to cancel advanced order:', error);
      throw error;
    }
  }

  /**
   * Update advanced order
   */
  async updateAdvancedOrder(orderId, updates) {
    try {
      return await api.put(`/advanced-orders/${orderId}`, updates);
    } catch (error) {
      console.error('Failed to update advanced order:', error);
      throw error;
    }
  }

  /**
   * Get OCO orders (One-Cancels-Other)
   */
  async getOCOOrders() {
    try {
      return await api.get('/advanced-orders/oco');
    } catch (error) {
      console.error('Failed to fetch OCO orders:', error);
      throw error;
    }
  }

  /**
   * Get conditional orders
   */
  async getConditionalOrders() {
    try {
      return await api.get('/advanced-orders/conditional');
    } catch (error) {
      console.error('Failed to fetch conditional orders:', error);
      throw error;
    }
  }

  /**
   * Get limit orders
   */
  async getLimitOrders() {
    try {
      return await api.get('/advanced-orders/limit');
    } catch (error) {
      console.error('Failed to fetch limit orders:', error);
      throw error;
    }
  }

  /**
   * Get advanced order statistics
   */
  async getStatistics() {
    try {
      return await api.get('/advanced-orders/stats');
    } catch (error) {
      console.error('Failed to fetch advanced order statistics:', error);
      throw error;
    }
  }
}

export default new AdvancedOrdersService();
