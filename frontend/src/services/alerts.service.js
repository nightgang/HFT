/**
 * Alerts service
 * Handles trading alerts and notifications
 */

import api from './api';

class AlertsService {
  /**
   * Create a new alert
   */
  async createAlert(alertData) {
    try {
      return await api.post('/alerts', {
        alertName: alertData.name,
        alertType: alertData.type,
        severity: alertData.severity || 'medium',
        conditionJson: alertData.condition,
        tokenMint: alertData.tokenMint,
        expiresAt: alertData.expiresAt,
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.active) params.append('active', filters.active);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const queryString = params.toString();
      const endpoint = queryString ? `/alerts?${queryString}` : '/alerts';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId) {
    try {
      return await api.get(`/alerts/${alertId}`);
    } catch (error) {
      console.error('Failed to fetch alert:', error);
      throw error;
    }
  }

  /**
   * Update alert
   */
  async updateAlert(alertId, updates) {
    try {
      return await api.put(`/alerts/${alertId}`, updates);
    } catch (error) {
      console.error('Failed to update alert:', error);
      throw error;
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId) {
    try {
      return await api.delete(`/alerts/${alertId}`);
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    }
  }

  /**
   * Enable alert
   */
  async enableAlert(alertId) {
    try {
      return await api.put(`/alerts/${alertId}`, { enabled: true });
    } catch (error) {
      console.error('Failed to enable alert:', error);
      throw error;
    }
  }

  /**
   * Disable alert
   */
  async disableAlert(alertId) {
    try {
      return await api.put(`/alerts/${alertId}`, { enabled: false });
    } catch (error) {
      console.error('Failed to disable alert:', error);
      throw error;
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(alertId, limit = 50, offset = 0) {
    try {
      return await api.get(`/alerts/${alertId}/history?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch alert history:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats() {
    try {
      return await api.get('/alerts/stats');
    } catch (error) {
      console.error('Failed to fetch alert stats:', error);
      throw error;
    }
  }
}

export default new AlertsService();
