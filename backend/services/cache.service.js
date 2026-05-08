const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
  }

  // Initialize Redis connection
  async initialize() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.error('Redis connection refused');
            return new Error('Redis connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.error('Redis retry attempts exhausted');
            return undefined;
          }
          // Exponential backoff
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  // Set key-value pair with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      throw error;
    }
  }

  // Get value by key
  async get(key) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }

      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Delete key
  async delete(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.del(key);
      logger.debug(`Cache delete: ${key} (${result} keys deleted)`);
      return result > 0;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Set multiple key-value pairs
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const pipeline = this.client.multi();
      keyValuePairs.forEach(({ key, value }) => {
        const serializedValue = JSON.stringify(value);
        pipeline.setEx(key, ttl, serializedValue);
      });

      await pipeline.exec();
      logger.debug(`Cache mset: ${keyValuePairs.length} keys set`);
    } catch (error) {
      logger.error('Cache mset error:', error);
      throw error;
    }
  }

  // Get multiple values
  async mget(keys) {
    try {
      if (!this.isConnected) {
        return keys.map(() => null);
      }

      const values = await this.client.mGet(keys);
      const parsedValues = values.map(value => {
        if (value) {
          try {
            return JSON.parse(value);
          } catch (parseError) {
            logger.warn('Failed to parse cached value:', parseError);
            return null;
          }
        }
        return null;
      });

      logger.debug(`Cache mget: ${keys.length} keys requested, ${parsedValues.filter(v => v !== null).length} hits`);
      return parsedValues;
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  // Increment counter
  async increment(key, amount = 1) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.incrBy(key, amount);
      logger.debug(`Cache increment: ${key} += ${amount} = ${result}`);
      return result;
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      throw error;
    }
  }

  // Set hash field
  async hset(key, field, value) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const serializedValue = JSON.stringify(value);
      await this.client.hSet(key, field, serializedValue);
      logger.debug(`Cache hset: ${key}.${field}`);
    } catch (error) {
      logger.error(`Cache hset error for key ${key}.${field}:`, error);
      throw error;
    }
  }

  // Get hash field
  async hget(key, field) {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.client.hGet(key, field);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.error(`Cache hget error for key ${key}.${field}:`, error);
      return null;
    }
  }

  // Get all hash fields
  async hgetall(key) {
    try {
      if (!this.isConnected) {
        return {};
      }

      const hash = await this.client.hGetAll(key);
      const parsedHash = {};

      for (const [field, value] of Object.entries(hash)) {
        try {
          parsedHash[field] = JSON.parse(value);
        } catch (parseError) {
          logger.warn(`Failed to parse hash field ${field}:`, parseError);
          parsedHash[field] = value;
        }
      }

      return parsedHash;
    } catch (error) {
      logger.error(`Cache hgetall error for key ${key}:`, error);
      return {};
    }
  }

  // Set with expiration only if key doesn't exist
  async setnx(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serializedValue = JSON.stringify(value);
      const result = await this.client.set(key, serializedValue, {
        NX: true,
        EX: ttl
      });

      const success = result === 'OK';
      logger.debug(`Cache setnx: ${key} (${success ? 'set' : 'skipped - key exists'})`);
      return success;
    } catch (error) {
      logger.error(`Cache setnx error for key ${key}:`, error);
      return false;
    }
  }

  // Get connection status
  isHealthy() {
    return this.isConnected;
  }

  // Close connection
  async close() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }

  // Cache key generators for common patterns
  static generateKey(...parts) {
    return parts.filter(part => part != null).join(':');
  }

  // Market data cache keys
  static marketDataKey(tokenMint, dataType = 'price') {
    return this.generateKey('market', tokenMint, dataType);
  }

  // Quote cache keys
  static quoteKey(inputMint, outputMint, amount, slippageBps) {
    return this.generateKey('quote', inputMint, outputMint, amount, slippageBps);
  }

  // Wallet cache keys
  static walletKey(walletId, dataType = 'balance') {
    return this.generateKey('wallet', walletId, dataType);
  }

  // Risk cache keys
  static riskKey(walletId, checkType) {
    return this.generateKey('risk', walletId, checkType);
  }
}

module.exports = new CacheService();
module.exports.CacheService = CacheService;