/**
 * Orders service
 * Handles order management and operations
 */

import api from './api';

class OrdersService {
  /**
   * Create a new order
   */
  async createOrder(orderData) {
    try {
      return await api.post('/trading/orders/create', orderData);
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getAllOrders(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.walletId) params.append('walletId', filters.walletId);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const endpoint = queryString ? `/trading/orders?${queryString}` : '/trading/orders';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      return await api.get(`/trading/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId) {
    try {
      return await api.post(`/trading/orders/${orderId}/cancel`, {});
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId, updates) {
    try {
      return await api.put(`/trading/orders/${orderId}`, updates);
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  }

  /**
   * Get active orders
   */
  async getActiveOrders(walletId) {
    try {
      return await api.get(`/trading/orders/active?walletId=${walletId}`);
    } catch (error) {
      console.error('Failed to fetch active orders:', error);
      throw error;
    }
  }

  /**
   * Get completed orders
   */
  async getCompletedOrders(walletId, limit = 50, offset = 0) {
    try {
      return await api.get(`/trading/orders/completed?walletId=${walletId}&limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch completed orders:', error);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStats(walletId) {
    try {
      return await api.get(`/trading/orders/stats?walletId=${walletId}`);
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      throw error;
    }
  }
}

export default new OrdersService();
