/**
 * System service
 * Handles system configuration and general operations
 */

import api from './api';

class SystemService {
  /**
   * Get system configuration
   */
  async getSystemConfig() {
    try {
      return await api.get('/system/config');
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      return await api.get('/system/stats');
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      throw error;
    }
  }

  /**
   * Get version information
   */
  async getVersionInfo() {
    try {
      return await api.get('/system/version');
    } catch (error) {
      console.error('Failed to fetch version info:', error);
      throw error;
    }
  }

  /**
   * Get API keys
   */
  async getAPIKeys() {
    try {
      return await api.get('/system/api-keys');
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      throw error;
    }
  }

  /**
   * Create API key
   */
  async createAPIKey(name, permissions = []) {
    try {
      return await api.post('/system/api-keys', { name, permissions });
    } catch (error) {
      console.error('Failed to create API key:', error);
      throw error;
    }
  }

  /**
   * Delete API key
   */
  async deleteAPIKey(keyId) {
    try {
      return await api.delete(`/system/api-keys/${keyId}`);
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw error;
    }
  }

  /**
   * Regenerate API key
   */
  async regenerateAPIKey(keyId) {
    try {
      return await api.post(`/system/api-keys/${keyId}/regenerate`, {});
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
      throw error;
    }
  }

  /**
   * Get webhook configuration
   */
  async getWebhooks() {
    try {
      return await api.get('/system/webhooks');
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      throw error;
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(webhookData) {
    try {
      return await api.post('/system/webhooks', webhookData);
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId) {
    try {
      return await api.delete(`/system/webhooks/${webhookId}`);
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId) {
    try {
      return await api.post(`/system/webhooks/${webhookId}/test`, {});
    } catch (error) {
      console.error('Failed to test webhook:', error);
      throw error;
    }
  }
}

export default new SystemService();
