// Failed Trade Recovery Queue (DLQ) Service
const logger = require('../../utils/logger');
const { query } = require('../../db/connection');
const circuitBreakerService = require('./circuit-breaker.service');
const { getKatanaEngine } = require('../engines/katana.engine');

class FailedTradeRecoveryService {
  constructor() {
    this.isProcessing = false;
    this.maxRetries = 3;
    this.processingInterval = 60000; // 1 minute
  }

  // Initialize recovery service
  async initialize() {
    logger.info('Failed Trade Recovery Service initialized');
    // Start periodic processing
    this.startProcessing();
  }

  // Add trade to recovery queue
  async addToRecoveryQueue(tradeId, reason, retryCount = 0) {
    try {
      const result = await query(`
        INSERT INTO trade_recovery_queue 
        (trade_id, reason, retry_count, next_retry_at, status)
        VALUES ($1, $2, $3, NOW() + INTERVAL '1 minute' * $4, 'pending')
        ON CONFLICT (trade_id) DO UPDATE SET
          reason = EXCLUDED.reason,
          retry_count = EXCLUDED.retry_count,
          next_retry_at = NOW() + INTERVAL '1 minute' * (
            SELECT retry_count FROM trade_recovery_queue WHERE trade_id = $1
          )
      `, [tradeId, reason, retryCount, Math.min(retryCount + 1, 5)]);

      logger.warn(`Trade ${tradeId} added to recovery queue: ${reason}`);
      return true;
    } catch (error) {
      logger.error('Failed to add trade to recovery queue:', error);
      return false;
    }
  }

  // Start periodic retry processing
  startProcessing() {
    setInterval(() => this.processRecoveryQueue(), this.processingInterval);
  }

  // Process recovery queue
  async processRecoveryQueue() {
    if (this.isProcessing) {
      logger.debug('Recovery processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending trades ready for retry
      const pendingTrades = await query(`
        SELECT * FROM trade_recovery_queue
        WHERE status = 'pending' 
        AND next_retry_at <= NOW()
        AND retry_count < $1
        ORDER BY created_at ASC
        LIMIT 10
      `, [this.maxRetries]);

      logger.info(`Processing ${pendingTrades.rowCount} trades from recovery queue`);

      for (const trade of pendingTrades.rows) {
        await this.retryTrade(trade);
      }

      // Mark failed trades
      await query(`
        UPDATE trade_recovery_queue
        SET status = 'failed', completed_at = NOW()
        WHERE status = 'pending' 
        AND retry_count >= $1
      `, [this.maxRetries]);

    } catch (error) {
      logger.error('Error processing recovery queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Retry a specific trade
  async retryTrade(trade) {
    const tradeId = trade.trade_id;

    try {
      logger.info(`Retrying trade ${tradeId} (attempt ${trade.retry_count + 1}/${this.maxRetries})`);

      // Get trade details
      const tradeData = await query(`
        SELECT * FROM trades WHERE trade_id = $1
      `, [tradeId]);

      if (tradeData.rowCount === 0) {
        logger.error(`Trade ${tradeId} not found`);
        await this.markAsCompleted(tradeId, 'failed');
        return;
      }

      const tradeDetail = tradeData.rows[0];

      // Use circuit breaker to retry execution
      await circuitBreakerService.execute(
        'trade_retry',
        async () => {
          const engine = getKatanaEngine();
          await engine.executeTrade(tradeDetail.params);
          logger.info(`Re-executing trade ${tradeId}`);

          // Update trade status
          await query(`
            UPDATE trades 
            SET status = 'completed', updated_at = NOW()
            WHERE trade_id = $1
          `, [tradeId]);
        }
      );

      // Mark as completed if successful
      await this.markAsCompleted(tradeId, 'success');
    } catch (error) {
      logger.warn(`Trade retry failed for ${tradeId}:`, error.message);

      // Increment retry count
      const newRetryCount = trade.retry_count + 1;

      if (newRetryCount >= this.maxRetries) {
        logger.error(`Trade ${tradeId} exceeded max retries`);
        await this.markAsCompleted(tradeId, 'failed');
      } else {
        // Update for next retry
        await query(`
          UPDATE trade_recovery_queue
          SET retry_count = $1, next_retry_at = NOW() + INTERVAL '1 minute' * $2
          WHERE trade_id = $3
        `, [newRetryCount, newRetryCount, tradeId]);
      }
    }
  }

  // Mark trade as completed
  async markAsCompleted(tradeId, status) {
    try {
      await query(`
        UPDATE trade_recovery_queue
        SET status = $1, completed_at = NOW()
        WHERE trade_id = $2
      `, [status, tradeId]);

      logger.info(`Trade recovery ${status}: ${tradeId}`);
    } catch (error) {
      logger.error('Failed to mark trade as completed:', error);
    }
  }

  // Get recovery queue stats
  async getQueueStats() {
    try {
      const stats = await query(`
        SELECT 
          status,
          COUNT(*) as count,
          AVG(retry_count) as avg_retries
        FROM trade_recovery_queue
        GROUP BY status
      `);

      return stats.rows;
    } catch (error) {
      logger.error('Failed to get recovery queue stats:', error);
      return [];
    }
  }

  // Clear old records from recovery queue
  async cleanupOldRecords(days = 7) {
    try {
      const result = await query(`
        DELETE FROM trade_recovery_queue
        WHERE completed_at < NOW() - INTERVAL '1 day' * $1
        RETURNING trade_id
      `, [days]);

      logger.info(`Cleaned up ${result.rowCount} old recovery records`);
      return result.rowCount;
    } catch (error) {
      logger.error('Failed to cleanup old records:', error);
    }
  }
}

module.exports = new FailedTradeRecoveryService();
