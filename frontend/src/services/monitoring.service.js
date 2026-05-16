/**
 * Monitoring service
 * Handles system monitoring and status tracking
 */

import api from './api';

class MonitoringService {
  /**
   * Get system status
   */
  async getSystemStatus() {
    try {
      return await api.get('/monitoring/system-status');
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      throw error;
    }
  }

  /**
   * Get health check
   */
  async getHealthCheck() {
    try {
      return await api.get('/monitoring/health');
    } catch (error) {
      console.error('Failed to fetch health check:', error);
      throw error;
    }
  }

  /**
   * Get active trades
   */
  async getActiveTrades() {
    try {
      return await api.get('/monitoring/active-trades');
    } catch (error) {
      console.error('Failed to fetch active trades:', error);
      throw error;
    }
  }

  /**
   * Get connected bots
   */
  async getConnectedBots() {
    try {
      return await api.get('/monitoring/bots');
    } catch (error) {
      console.error('Failed to fetch connected bots:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    try {
      return await api.get('/monitoring/performance');
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get error logs
   */
  async getErrorLogs(limit = 100, offset = 0) {
    try {
      return await api.get(`/monitoring/error-logs?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
      throw error;
    }
  }

  /**
   * Get system logs
   */
  async getSystemLogs(limit = 100, offset = 0) {
    try {
      return await api.get(`/monitoring/system-logs?limit=${limit}&offset=${offset}`);
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
      throw error;
    }
  }

  /**
   * Get live feed
   */
  async getLiveFeed(limit = 50) {
    try {
      return await api.get(`/monitoring/live-feed?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch live feed:', error);
      throw error;
    }
  }

  /**
   * Clear logs
   */
  async clearLogs() {
    try {
      return await api.post('/monitoring/clear-logs', {});
    } catch (error) {
      console.error('Failed to clear logs:', error);
      throw error;
    }
  }
}

export default new MonitoringService();
