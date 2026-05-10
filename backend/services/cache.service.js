const redis = require('redis');
const logger = require('../utils/logger');
const zlib = require('zlib');
const { promisify } = require('util');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
    this.memoryCache = new Map(); // L1 memory cache
    this.memoryCacheMaxSize = 10000; // Max items in memory cache
    this.compressionThreshold = 1024; // Compress values larger than 1KB
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      memoryHits: 0,
      redisHits: 0
    };
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

  // ===== ADVANCED CACHING FEATURES =====

  // Multi-level caching (Memory L1 + Redis L2)
  async getMultiLevel(key) {
    // Check L1 memory cache first
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue && memoryValue.expires > Date.now()) {
      this.cacheMetrics.memoryHits++;
      this.cacheMetrics.hits++;
      return memoryValue.data;
    }

    // Check L2 Redis cache
    const redisValue = await this.get(key);
    if (redisValue !== null) {
      this.cacheMetrics.redisHits++;
      this.cacheMetrics.hits++;
      // Promote to L1 cache
      this.setMemoryCache(key, redisValue, this.defaultTTL * 1000);
      return redisValue;
    }

    this.cacheMetrics.misses++;
    return null;
  }

  // Set with multi-level caching
  async setMultiLevel(key, value, ttl = this.defaultTTL) {
    // Set in Redis L2
    await this.set(key, value, ttl);
    
    // Set in memory L1
    this.setMemoryCache(key, value, ttl * 1000);
    
    this.cacheMetrics.sets++;
  }

  // Memory cache helper
  setMemoryCache(key, value, ttlMs) {
    // Evict if cache is full (simple LRU-like behavior)
    if (this.memoryCache.size >= this.memoryCacheMaxSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + ttlMs
    });
  }

  // Compression for large values
  async setCompressed(key, value, ttl = this.defaultTTL) {
    try {
      const serialized = JSON.stringify(value);
      
      if (serialized.length > this.compressionThreshold) {
        const compressed = await promisify(zlib.gzip)(Buffer.from(serialized));
        const compressedData = {
          compressed: true,
          data: compressed.toString('base64')
        };
        await this.set(key, compressedData, ttl);
      } else {
        await this.set(key, value, ttl);
      }
      
      this.cacheMetrics.sets++;
    } catch (error) {
      logger.error(`Compression error for key ${key}:`, error);
      await this.set(key, value, ttl);
    }
  }

  // Decompression for retrieved values
  async getCompressed(key) {
    const value = await this.get(key);
    
    if (value && value.compressed) {
      try {
        const buffer = Buffer.from(value.data, 'base64');
        const decompressed = await promisify(zlib.gunzip)(buffer);
        const parsed = JSON.parse(decompressed.toString());
        this.cacheMetrics.hits++;
        return parsed;
      } catch (error) {
        logger.error(`Decompression error for key ${key}:`, error);
        return null;
      }
    }
    
    if (value) {
      this.cacheMetrics.hits++;
    } else {
      this.cacheMetrics.misses++;
    }
    
    return value;
  }

  // Cache warming for frequently accessed data
  async warmCache(keys, fetchFunction, ttl = this.defaultTTL) {
    try {
      const missingKeys = [];
      
      // Check which keys are missing
      for (const key of keys) {
        const exists = await this.exists(key);
        if (!exists) {
          missingKeys.push(key);
        }
      }
      
      if (missingKeys.length > 0) {
        logger.info(`Warming cache for ${missingKeys.length} keys`);
        const values = await fetchFunction(missingKeys);
        
        const keyValuePairs = missingKeys.map((key, index) => ({
          key,
          value: values[index]
        }));
        
        await this.mset(keyValuePairs, ttl);
      }
    } catch (error) {
      logger.error('Cache warming error:', error);
    }
  }

  // Pattern-based cache invalidation
  async invalidatePattern(pattern) {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const deleted = await this.client.del(keys);
        this.cacheMetrics.deletes += deleted;
        logger.info(`Invalidated ${deleted} keys matching pattern: ${pattern}`);
        return deleted;
      }
      return 0;
    } catch (error) {
      logger.error(`Pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Distributed locking using Redis
  async acquireLock(lockKey, ttl = 30) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const lockValue = Date.now().toString();
      const acquired = await this.client.set(lockKey, lockValue, {
        NX: true,
        EX: ttl
      });

      return acquired === 'OK';
    } catch (error) {
      logger.error(`Lock acquisition error for key ${lockKey}:`, error);
      return false;
    }
  }

  // Release distributed lock
  async releaseLock(lockKey) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.del(lockKey);
      return result > 0;
    } catch (error) {
      logger.error(`Lock release error for key ${lockKey}:`, error);
      return false;
    }
  }

  // Cache analytics and monitoring
  getCacheMetrics() {
    const metrics = { ...this.cacheMetrics };
    
    if (metrics.hits + metrics.misses > 0) {
      metrics.hitRate = (metrics.hits / (metrics.hits + metrics.misses)) * 100;
    } else {
      metrics.hitRate = 0;
    }
    
    metrics.memoryCacheSize = this.memoryCache.size;
    metrics.redisConnected = this.isConnected;
    
    return metrics;
  }

  // Reset cache metrics
  resetMetrics() {
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      memoryHits: 0,
      redisHits: 0
    };
  }

  // TTL refresh for frequently accessed keys
  async refreshTTL(key, newTTL = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.expire(key, newTTL);
      if (result) {
        logger.debug(`Refreshed TTL for key: ${key} to ${newTTL}s`);
      }
      return result;
    } catch (error) {
      logger.error(`TTL refresh error for key ${key}:`, error);
      return false;
    }
  }

  // Batch operations with pipeline
  async batchOperation(operations) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const pipeline = this.client.multi();
      
      operations.forEach(op => {
        switch (op.type) {
          case 'set':
            pipeline.setEx(op.key, op.ttl || this.defaultTTL, JSON.stringify(op.value));
            break;
          case 'get':
            pipeline.get(op.key);
            break;
          case 'del':
            pipeline.del(op.key);
            break;
          case 'incr':
            pipeline.incrBy(op.key, op.amount || 1);
            break;
        }
      });

      const results = await pipeline.exec();
      logger.debug(`Batch operation completed: ${operations.length} operations`);
      return results;
    } catch (error) {
      logger.error('Batch operation error:', error);
      throw error;
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

  // Message Queue methods using Redis Streams

  // Publish message to stream
  async publishMessage(stream, message) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const id = await this.client.xAdd(stream, '*', { data: JSON.stringify(message) });
      logger.debug(`Message published to stream ${stream}: ${id}`);
      return id;
    } catch (error) {
      logger.error(`Error publishing message to stream ${stream}:`, error);
      throw error;
    }
  }

  // Consume messages from stream
  async consumeMessages(stream, consumerGroup, consumerName, count = 10) {
    try {
      if (!this.isConnected) {
        return [];
      }

      // Ensure consumer group exists
      try {
        await this.client.xGroupCreate(stream, consumerGroup, '0', { MKSTREAM: true });
      } catch (groupError) {
        if (!groupError.message.includes('BUSYGROUP')) {
          throw groupError;
        }
      }

      const messages = await this.client.xReadGroup(consumerGroup, consumerName, [{ key: stream, id: '>' }], { COUNT: count, BLOCK: 1000 });

      if (!messages || messages.length === 0) {
        return [];
      }

      const parsedMessages = messages[0].messages.map(msg => ({
        id: msg.id,
        data: JSON.parse(msg.message.data)
      }));

      return parsedMessages;
    } catch (error) {
      logger.error(`Error consuming messages from stream ${stream}:`, error);
      return [];
    }
  }

  // Acknowledge message
  async acknowledgeMessage(stream, consumerGroup, messageId) {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.client.xAck(stream, consumerGroup, messageId);
      logger.debug(`Message acknowledged: ${stream}:${consumerGroup}:${messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error acknowledging message ${messageId}:`, error);
      return false;
    }
  }
}

module.exports = new CacheService();
module.exports.CacheService = CacheService;