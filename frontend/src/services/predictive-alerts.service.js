/**
 * Predictive Alerts service
 * Handles predictive alerts and anomaly detection
 */

import api from './api';

class PredictiveAlertsService {
  /**
   * Create predictive alert
   */
  async createPredictiveAlert(alertData) {
    try {
      return await api.post('/predictive-alerts/create', alertData);
    } catch (error) {
      console.error('Failed to create predictive alert:', error);
      throw error;
    }
  }

  /**
   * Get all predictive alerts
   */
  async getAllAlerts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.active) params.append('active', filters.active);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString ? `/predictive-alerts?${queryString}` : '/predictive-alerts';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch predictive alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId) {
    try {
      return await api.get(`/predictive-alerts/${alertId}`);
    } catch (error) {
      console.error('Failed to fetch alert:', error);
      throw error;
    }
  }

  /**
   * Get anomalies
   */
  async getAnomalies(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.tokenMint) params.append('tokenMint', filters.tokenMint);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const endpoint = queryString ? `/predictive-alerts/anomalies?${queryString}` : '/predictive-alerts/anomalies';

      return await api.get(endpoint);
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
      throw error;
    }
  }

  /**
   * Get price predictions
   */
  async getPricePredictions(tokenMint, timeframe = '1h') {
    try {
      return await api.get(`/predictive-alerts/predictions/${tokenMint}?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch price predictions:', error);
      throw error;
    }
  }

  /**
   * Get trend predictions
   */
  async getTrendPredictions(tokenMint) {
    try {
      return await api.get(`/predictive-alerts/trend-predictions/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch trend predictions:', error);
      throw error;
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId) {
    try {
      return await api.delete(`/predictive-alerts/${alertId}`);
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId) {
    try {
      return await api.put(`/predictive-alerts/${alertId}/acknowledge`);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      throw error;
    }
  }

  /**
   * Get prediction accuracy
   */
  async getPredictionAccuracy() {
    try {
      return await api.get('/predictive-alerts/accuracy');
    } catch (error) {
      console.error('Failed to fetch prediction accuracy:', error);
      throw error;
    }
  }
}

export default new PredictiveAlertsService();
