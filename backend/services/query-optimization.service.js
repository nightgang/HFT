// Database Query Optimization Service
// Implements caching, batch operations, and connection pooling optimizations

const logger = require('../utils/logger');

class QueryOptimizationService {
  constructor() {
    this.queryCache = new Map();
    this.cacheTimeout = 60000; // 1 minute default TTL
    this.batchSize = 100;
  }

  /**
   * Batch fetch wallet trades for better performance
   * Prevents N+1 query issues
   */
  async getBatchWalletTrades(walletIds, limit = 50) {
    try {
      const cacheKey = `batch_trades_${walletIds.join(',')}_${limit}`;
      
      if (this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Use array for IN clause - more efficient than multiple queries
      const placeholders = walletIds.map((_, i) => `$${i + 1}`).join(',');
      const query = `
        SELECT t.*, tw.wallet_address, tw.wallet_name
        FROM trades t
        JOIN wallets tw ON t.wallet_id = tw.wallet_id
        WHERE t.wallet_id = ANY($1::uuid[])
        ORDER BY t.created_at DESC
        LIMIT $2
      `;

      const result = await require('../db/connection').query(query, [walletIds, limit]);
      
      this.queryCache.set(cacheKey, {
        data: result.rows,
        timestamp: Date.now()
      });

      return result.rows;
    } catch (error) {
      logger.error('Batch wallet trades query error:', error);
      throw error;
    }
  }

  /**
   * Batch fetch wallet balances with token metadata
   * Reduces DB roundtrips
   */
  async getBatchWalletBalances(walletIds) {
    try {
      const cacheKey = `batch_balances_${walletIds.join(',')}`;
      
      if (this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const query = `
        SELECT 
          wb.wallet_id, 
          wb.token_mint, 
          wb.token_symbol, 
          wb.balance,
          wb.reserved_balance,
          tw.wallet_address
        FROM wallet_balances wb
        JOIN wallets tw ON wb.wallet_id = tw.wallet_id
        WHERE wb.wallet_id = ANY($1::uuid[])
        ORDER BY wb.balance DESC
      `;

      const result = await require('../db/connection').query(query, [walletIds]);
      
      this.queryCache.set(cacheKey, {
        data: result.rows,
        timestamp: Date.now()
      });

      return result.rows;
    } catch (error) {
      logger.error('Batch wallet balances query error:', error);
      throw error;
    }
  }

  /**
   * Get recent trades with pagination for API responses
   * Uses keyset pagination for efficiency
   */
  async getRecentTradesEfficiently(walletId, limit = 50, lastTradeId = null) {
    try {
      let query = `
        SELECT 
          t.trade_id, t.wallet_id, t.strategy_type, t.status,
          t.input_token_symbol, t.output_token_symbol,
          t.expected_output_amount, t.actual_output_amount,
          t.slippage_percent, t.transaction_fee,
          t.created_at, t.executed_at
        FROM trades t
        WHERE t.wallet_id = $1
      `;

      const params = [walletId];

      if (lastTradeId) {
        query += ` AND t.created_at < (SELECT created_at FROM trades WHERE trade_id = $2)`;
        params.push(lastTradeId);
      }

      query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit + 1);

      const result = await require('../db/connection').query(query, params);
      
      // Check if there are more results
      const hasMore = result.rows.length > limit;
      const trades = result.rows.slice(0, limit);

      return {
        trades,
        hasMore,
        nextCursor: hasMore ? trades[trades.length - 1].trade_id : null
      };
    } catch (error) {
      logger.error('Recent trades query error:', error);
      throw error;
    }
  }

  /**
   * Aggregate trade statistics efficiently
   * Uses GROUP BY and aggregate functions
   */
  async getWalletTradeStats(walletId, timeWindow = 30) {
    try {
      const cacheKey = `wallet_stats_${walletId}_${timeWindow}d`;
      
      if (this.queryCache.has(cacheKey)) {
        const cached = this.queryCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 min cache
          return cached.data;
        }
      }

      const query = `
        SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_trades,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_trades,
          AVG(slippage_percent) as avg_slippage,
          MIN(created_at) as first_trade,
          MAX(created_at) as last_trade,
          ROUND(AVG(transaction_fee)::numeric, 8) as avg_fee
        FROM trades
        WHERE wallet_id = $1
        AND created_at > NOW() - INTERVAL '${timeWindow} days'
      `;

      const result = await require('../db/connection').query(query, [walletId]);
      const stats = result.rows[0] || {};
      
      this.queryCache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;
    } catch (error) {
      logger.error('Trade stats query error:', error);
      throw error;
    }
  }

  /**
   * Batch insert trade records efficiently
   * Reduces DB roundtrips for multiple inserts
   */
  async batchInsertTrades(trades) {
    try {
      if (trades.length === 0) return [];
      
      const query = `
        INSERT INTO trades 
        (wallet_id, strategy_type, status, direction, input_token_mint, 
         input_token_symbol, input_amount, output_token_mint, 
         output_token_symbol, expected_output_amount, created_at)
        VALUES ${trades
          .map((_, i) => {
            const offset = i * 11;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 
                    $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`;
          })
          .join(',')}
        RETURNING trade_id, created_at
      `;

      const params = trades.flatMap(t => [
        t.walletId, t.strategyType, t.status || 'pending', t.direction,
        t.inputTokenMint, t.inputTokenSymbol, t.inputAmount,
        t.outputTokenMint, t.outputTokenSymbol, t.expectedOutputAmount,
        new Date()
      ]);

      const result = await require('../db/connection').query(query, params);
      
      logger.info(`Batch inserted ${result.rows.length} trades`);
      return result.rows;
    } catch (error) {
      logger.error('Batch insert trades error:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific keys
   */
  clearCache(pattern = null) {
    if (!pattern) {
      this.queryCache.clear();
      logger.info('Query cache cleared');
      return;
    }

    let cleared = 0;
    for (const [key] of this.queryCache) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
        cleared++;
      }
    }
    logger.info(`Cleared ${cleared} cache entries matching "${pattern}"`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      entries: Array.from(this.queryCache.keys())
    };
  }
}

module.exports = new QueryOptimizationService();
