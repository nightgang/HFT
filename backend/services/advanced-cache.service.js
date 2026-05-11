const { query } = require('../db/connection');
const logger = require('../utils/logger');

class AdvancedCacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  // Set cache value
  async set(key, value, ttlSeconds = 3600) {
    try {
      const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));
      
      // Store in database
      await query(`
        INSERT INTO cache_store (cache_key, cache_value, ttl_seconds, expires_at, partition_key)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (cache_key) DO UPDATE SET
          cache_value = EXCLUDED.cache_value,
          ttl_seconds = EXCLUDED.ttl_seconds,
          expires_at = EXCLUDED.expires_at
      `, [key, JSON.stringify(value), ttlSeconds, expiresAt, this.getPartitionKey(key)]);

      // Store in memory for faster access
      this.memoryCache.set(key, {
        value,
        expiresAt,
        ttlSeconds
      });

      this.cacheStats.sets++;
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error('Error setting cache:', error);
      throw error;
    }
  }

  // Get cache value
  async get(key) {
    try {
      // Check memory cache first
      const memoryItem = this.memoryCache.get(key);
      if (memoryItem && memoryItem.expiresAt > new Date()) {
        this.cacheStats.hits++;
        return memoryItem.value;
      }

      // Check database
      const result = await query(`
        SELECT cache_value, expires_at FROM cache_store
        WHERE cache_key = $1 AND expires_at > CURRENT_TIMESTAMP
      `, [key]);

      if (result.rows.length > 0) {
        const value = JSON.parse(result.rows[0].cache_value);
        
        // Update memory cache
        this.memoryCache.set(key, {
          value,
          expiresAt: new Date(result.rows[0].expires_at)
        });

        this.cacheStats.hits++;
        return value;
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      logger.error('Error getting cache:', error);
      throw error;
    }
  }

  // Delete cache value
  async delete(key) {
    try {
      await query('DELETE FROM cache_store WHERE cache_key = $1', [key]);
      this.memoryCache.delete(key);
      this.cacheStats.deletes++;
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error('Error deleting cache:', error);
      throw error;
    }
  }

  // Clear expired entries
  async cleanup() {
    try {
      const result = await query('DELETE FROM cache_store WHERE expires_at <= CURRENT_TIMESTAMP');
      logger.info(`Cache cleanup: ${result.rowCount} expired entries removed`);
      
      // Clean memory cache
      const now = new Date();
      for (const [key, item] of this.memoryCache.entries()) {
        if (item.expiresAt <= now) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      logger.error('Error during cache cleanup:', error);
      throw error;
    }
  }

  // Get cache statistics
  getStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests) * 100 : 0;

    return {
      ...this.cacheStats,
      hit_rate_percent: hitRate.toFixed(2),
      memory_cache_size: this.memoryCache.size,
      total_requests: totalRequests
    };
  }

  // Get partition key for sharding
  getPartitionKey(key) {
    // Simple hash-based partitioning
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash % 10).toString(); // 10 partitions
  }

  // Cache with automatic refresh
  async getOrSet(key, fetcher, ttlSeconds = 3600) {
    try {
      let value = await this.get(key);
      if (value === null) {
        value = await fetcher();
        await this.set(key, value, ttlSeconds);
      }
      return value;
    } catch (error) {
      logger.error('Error in getOrSet:', error);
      throw error;
    }
  }

  // Multi-get for multiple keys
  async multiGet(keys) {
    try {
      const results = {};
      const missingKeys = [];

      // Check memory cache first
      for (const key of keys) {
        const memoryItem = this.memoryCache.get(key);
        if (memoryItem && memoryItem.expiresAt > new Date()) {
          results[key] = memoryItem.value;
          this.cacheStats.hits++;
        } else {
          missingKeys.push(key);
        }
      }

      // Fetch missing keys from database
      if (missingKeys.length > 0) {
        const placeholders = missingKeys.map((_, i) => `$${i + 1}`).join(',');
        const dbResult = await query(`
          SELECT cache_key, cache_value, expires_at FROM cache_store
          WHERE cache_key IN (${placeholders}) AND expires_at > CURRENT_TIMESTAMP
        `, missingKeys);

        for (const row of dbResult.rows) {
          const value = JSON.parse(row.cache_value);
          results[row.cache_key] = value;
          
          // Update memory cache
          this.memoryCache.set(row.cache_key, {
            value,
            expiresAt: new Date(row.expires_at)
          });
        }

        this.cacheStats.hits += dbResult.rows.length;
        this.cacheStats.misses += missingKeys.length - dbResult.rows.length;
      }

      return results;
    } catch (error) {
      logger.error('Error in multiGet:', error);
      throw error;
    }
  }

  // Set multiple values
  async multiSet(keyValuePairs, ttlSeconds = 3600) {
    try {
      const expiresAt = new Date(Date.now() + (ttlSeconds * 1000));
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        await query(`
          INSERT INTO cache_store (cache_key, cache_value, ttl_seconds, expires_at, partition_key)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (cache_key) DO UPDATE SET
            cache_value = EXCLUDED.cache_value,
            ttl_seconds = EXCLUDED.ttl_seconds,
            expires_at = EXCLUDED.expires_at
        `, [key, JSON.stringify(value), ttlSeconds, expiresAt, this.getPartitionKey(key)]);

        // Update memory cache
        this.memoryCache.set(key, {
          value,
          expiresAt,
          ttlSeconds
        });
      }

      this.cacheStats.sets += Object.keys(keyValuePairs).length;
    } catch (error) {
      logger.error('Error in multiSet:', error);
      throw error;
    }
  }
}

module.exports = new AdvancedCacheService();
