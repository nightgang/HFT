const logger = require('../../utils/logger');

class SecretsService {
  constructor() {
    this.provider = (process.env.SECRETS_MANAGER_PROVIDER || 'env').toLowerCase();
    this.cache = {};
    this.awsClient = null;
    this.awsSecretName = process.env.AWS_SECRETS_MANAGER_SECRET_NAME;
  }

  getSecretSync(secretName) {
    if (this.provider === 'aws') {
      logger.warn('AWS secrets manager provider configured, but sync secret resolution is not supported. Falling back to environment values for safe startup.');
    }
    return process.env[secretName] || null;
  }

  async getSecret(secretName) {
    if (this.provider === 'aws') {
      return this.getAwsSecret(secretName);
    }
    return process.env[secretName] || null;
  }

  async getAwsSecret(secretName) {
    if (this.cache[secretName]) {
      return this.cache[secretName];
    }

    if (!this.awsSecretName) {
      throw new Error('AWS_SECRETS_MANAGER_SECRET_NAME is required for AWS secrets provider');
    }

    try {
      if (!this.awsClient) {
        const { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');
        this.awsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });
      }

      const { GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
      const response = await this.awsClient.send(
        new GetSecretValueCommand({ SecretId: this.awsSecretName })
      );

      let secretPayload = {};
      if (response.SecretString) {
        try {
          secretPayload = JSON.parse(response.SecretString);
        } catch (err) {
          logger.warn('AWS secret string is not JSON, returning raw value');
          this.cache[secretName] = response.SecretString;
          return response.SecretString;
        }
      }

      const secretValue = secretPayload[secretName] || null;
      if (!secretValue) {
        throw new Error(`Secret ${secretName} not found in AWS secret payload`);
      }

      this.cache[secretName] = secretValue;
      return secretValue;
    } catch (error) {
      logger.error('AWS secrets manager error:', error.message);
      if (process.env[secretName]) {
        logger.warn(`Falling back to environment variable ${secretName}`);
        return process.env[secretName];
      }
      throw error;
    }
  }
}

module.exports = new SecretsService();
