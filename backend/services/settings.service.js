const logger = require('../utils/logger');

/**
 * SettingsService - Manages system configuration and trading parameters
 */
class SettingsService {
  constructor(pool) {
    this.pool = pool;
    this.settingsCache = new Map();
    this.defaultSettings = {
      maxDailyLoss: 1000,
      maxPositionSize: 10000,
      maxTradeFrequency: 20,
      minTradeInterval: 60,
      riskTolerance: 'medium',
      autoTradeEnabled: false,
      sentimentWeighting: 0.3,
      technicalWeighting: 0.5,
      riskWeighting: 0.2,
    };
  }

  /**
   * Initialize settings table
   */
  async initialize() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          wallet_id VARCHAR(255),
          setting_key VARCHAR(255) NOT NULL,
          setting_value TEXT NOT NULL,
          data_type VARCHAR(50),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(wallet_id, setting_key)
        );
        CREATE INDEX IF NOT EXISTS idx_settings_wallet ON system_settings(wallet_id);
      `;
      await this.pool.query(query);
      logger.info('Settings table initialized');
    } catch (error) {
      logger.error('Error initializing settings table:', error);
      throw error;
    }
  }

  /**
   * Get all settings for a wallet
   * @param {string} walletId - Wallet identifier
   * @returns {object} Settings object
   */
  async getSettings(walletId) {
    try {
      // Check cache first
      if (this.settingsCache.has(walletId)) {
        return this.settingsCache.get(walletId);
      }

      const query = `
        SELECT setting_key, setting_value, data_type 
        FROM system_settings 
        WHERE wallet_id = $1
      `;
      const result = await this.pool.query(query, [walletId]);

      const settings = { ...this.defaultSettings };
      
      result.rows.forEach((row) => {
        let value = row.setting_value;
        // Parse based on data type
        if (row.data_type === 'number') {
          value = parseFloat(value);
        } else if (row.data_type === 'integer') {
          value = parseInt(value);
        } else if (row.data_type === 'boolean') {
          value = value === 'true';
        }
        settings[row.setting_key] = value;
      });

      // Cache for 5 minutes
      this.settingsCache.set(walletId, settings);
      setTimeout(() => this.settingsCache.delete(walletId), 5 * 60 * 1000);

      return settings;
    } catch (error) {
      logger.error('Error fetching settings:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Update settings for a wallet
   * @param {string} walletId - Wallet identifier
   * @param {object} settings - Settings to update
   * @returns {object} Updated settings
   */
  async updateSettings(walletId, settings) {
    try {
      const validSettings = this.validateSettings(settings);
      
      const updateQueries = Object.entries(validSettings).map(([key, value]) => {
        const dataType = this.getDataType(value);
        return {
          text: `
            INSERT INTO system_settings (wallet_id, setting_key, setting_value, data_type, description)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (wallet_id, setting_key) 
            DO UPDATE SET setting_value = $3, data_type = $4, updated_at = CURRENT_TIMESTAMP
          `,
          values: [walletId, key, String(value), dataType, this.getDescription(key)],
        };
      });

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        for (const query of updateQueries) {
          await client.query(query);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Invalidate cache
      this.settingsCache.delete(walletId);

      return await this.getSettings(walletId);
    } catch (error) {
      logger.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Get a single setting value
   * @param {string} walletId - Wallet identifier
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  async getSetting(walletId, key) {
    try {
      const settings = await this.getSettings(walletId);
      return settings[key] || this.defaultSettings[key];
    } catch (error) {
      logger.error('Error getting setting:', error);
      return this.defaultSettings[key];
    }
  }

  /**
   * Update a single setting
   * @param {string} walletId - Wallet identifier
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {*} Updated value
   */
  async updateSetting(walletId, key, value) {
    return this.updateSettings(walletId, { [key]: value });
  }

  /**
   * Reset settings to defaults
   * @param {string} walletId - Wallet identifier
   */
  async resetSettings(walletId) {
    try {
      const query = 'DELETE FROM system_settings WHERE wallet_id = $1';
      await this.pool.query(query, [walletId]);
      this.settingsCache.delete(walletId);
      return this.defaultSettings;
    } catch (error) {
      logger.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Validate settings against constraints
   * @private
   */
  validateSettings(settings) {
    const validated = {};

    Object.entries(settings).forEach(([key, value]) => {
      if (!(key in this.defaultSettings)) {
        return; // Skip unknown settings
      }

      switch (key) {
        case 'maxDailyLoss':
        case 'maxPositionSize':
          validated[key] = Math.max(0, parseFloat(value));
          break;
        case 'maxTradeFrequency':
        case 'minTradeInterval':
          validated[key] = Math.max(1, parseInt(value));
          break;
        case 'riskTolerance':
          if (['low', 'medium', 'high'].includes(value)) {
            validated[key] = value;
          }
          break;
        case 'autoTradeEnabled':
          validated[key] = Boolean(value);
          break;
        case 'sentimentWeighting':
        case 'technicalWeighting':
        case 'riskWeighting':
          validated[key] = Math.min(1, Math.max(0, parseFloat(value)));
          break;
        default:
          validated[key] = value;
      }
    });

    return validated;
  }

  /**
   * Get data type for value
   * @private
   */
  getDataType(value) {
    if (value === true || value === false) return 'boolean';
    if (Number.isInteger(value)) return 'integer';
    if (typeof value === 'number') return 'number';
    return 'string';
  }

  /**
   * Get description for setting key
   * @private
   */
  getDescription(key) {
    const descriptions = {
      maxDailyLoss: 'Maximum loss allowed per day in USD',
      maxPositionSize: 'Maximum position size for single trade in USD',
      maxTradeFrequency: 'Maximum number of trades per hour',
      minTradeInterval: 'Minimum time between trades in seconds',
      riskTolerance: 'Risk tolerance level (low/medium/high)',
      autoTradeEnabled: 'Enable automatic trading',
      sentimentWeighting: 'Weight for sentiment signals (0-1)',
      technicalWeighting: 'Weight for technical signals (0-1)',
      riskWeighting: 'Weight for risk assessment (0-1)',
    };
    return descriptions[key] || '';
  }

  /**
   * Get trading limits for wallet
   * @param {string} walletId - Wallet identifier
   * @returns {object} Trading limits
   */
  async getTradingLimits(walletId) {
    try {
      const settings = await this.getSettings(walletId);
      return {
        maxDailyLoss: settings.maxDailyLoss,
        maxPositionSize: settings.maxPositionSize,
        maxTradeFrequency: settings.maxTradeFrequency,
        minTradeInterval: settings.minTradeInterval,
      };
    } catch (error) {
      logger.error('Error getting trading limits:', error);
      return {
        maxDailyLoss: this.defaultSettings.maxDailyLoss,
        maxPositionSize: this.defaultSettings.maxPositionSize,
        maxTradeFrequency: this.defaultSettings.maxTradeFrequency,
        minTradeInterval: this.defaultSettings.minTradeInterval,
      };
    }
  }

  /**
   * Get signal weights for analysis
   * @param {string} walletId - Wallet identifier
   * @returns {object} Signal weights
   */
  async getSignalWeights(walletId) {
    try {
      const settings = await this.getSettings(walletId);
      const total = settings.sentimentWeighting + settings.technicalWeighting + settings.riskWeighting;
      
      return {
        sentiment: settings.sentimentWeighting / (total || 1),
        technical: settings.technicalWeighting / (total || 1),
        risk: settings.riskWeighting / (total || 1),
      };
    } catch (error) {
      logger.error('Error getting signal weights:', error);
      return {
        sentiment: 0.33,
        technical: 0.34,
        risk: 0.33,
      };
    }
  }
}

module.exports = SettingsService;
