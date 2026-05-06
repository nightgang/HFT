const axios = require('axios');
const logger = require('../utils/logger');

class HeliusService {
  constructor() {
    this.apiKey = process.env.HELIUS_API_KEY;
    this.baseUrl = 'https://api.helius.xyz';
    this.timeout = 30000;
  }

  async getTokenMetadata(mintAddress) {
    try {
      const response = await axios.post(`${this.baseUrl}/v0/tokens/metadata`, {
        mintAccounts: [mintAddress],
        includeOffChain: true,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          'api-key': this.apiKey,
        },
        timeout: this.timeout,
      });

      return response.data[0] || null;
    } catch (error) {
      logger.error('Helius metadata error:', error.message);
      return null;
    }
  }

  async getAccountInfo(accountAddress) {
    try {
      const response = await axios.get(`${this.baseUrl}/v0/addresses/${accountAddress}/balances`, {
        params: {
          'api-key': this.apiKey,
        },
        timeout: this.timeout,
      });

      return response.data;
    } catch (error) {
      logger.error('Helius account info error:', error.message);
      return null;
    }
  }

  async getRecentTransactions(accountAddress, limit = 20) {
    try {
      const response = await axios.post(`${this.baseUrl}/v0/transactions`, {
        account: accountAddress,
        limit,
      }, {
        params: {
          'api-key': this.apiKey,
        },
        timeout: this.timeout,
      });

      return response.data || [];
    } catch (error) {
      logger.error('Helius recent transactions error:', error.message);
      return [];
    }
  }

  // For webhook setup (would need to be configured externally)
  async createWebhook(webhookUrl, accountAddresses) {
    try {
      const response = await axios.post(`${this.baseUrl}/v0/webhooks`, {
        webhookURL: webhookUrl,
        accountAddresses,
        webhookType: 'enhanced',
        transactionTypes: ['Any'],
        commitment: 'confirmed',
      }, {
        params: {
          'api-key': this.apiKey,
        },
        timeout: this.timeout,
      });

      return response.data;
    } catch (error) {
      logger.error('Helius webhook creation error:', error.message);
      throw error;
    }
  }

  async deleteWebhook(webhookId) {
    try {
      await axios.delete(`${this.baseUrl}/v0/webhooks/${webhookId}`, {
        params: {
          'api-key': this.apiKey,
        },
      });
    } catch (error) {
      logger.error('Helius webhook deletion error:', error.message);
      throw error;
    }
  }
}

module.exports = new HeliusService();