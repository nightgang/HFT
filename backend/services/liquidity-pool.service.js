const LiquidityPoolModel = require('../models/liquidity-pool.model');
const logger = require('../utils/logger');

class LiquidityPoolService {
  // Create a liquidity pool position
  async createPoolPosition(walletId, poolData) {
    try {
      const pool = await LiquidityPoolModel.createPool({
        wallet_id: walletId,
        ...poolData
      });
      logger.info(`Liquidity pool position created: ${pool.pool_id}`);
      return pool;
    } catch (error) {
      logger.error('Error creating liquidity pool position:', error);
      throw error;
    }
  }

  // Get pools for wallet
  async getWalletPools(walletId) {
    try {
      const pools = await LiquidityPoolModel.getPoolsByWallet(walletId);
      return pools;
    } catch (error) {
      logger.error('Error fetching wallet pools:', error);
      throw error;
    }
  }

  // Update pool metrics
  async updatePoolMetrics(poolId, metrics) {
    try {
      const updated = await LiquidityPoolModel.updatePoolMetrics(poolId, metrics);
      logger.info(`Pool metrics updated: ${poolId}`);
      return updated;
    } catch (error) {
      logger.error('Error updating pool metrics:', error);
      throw error;
    }
  }

  // Remove liquidity (close position)
  async removeLiquidity(poolId, walletId) {
    try {
      const pool = await LiquidityPoolModel.getPoolById(poolId);
      if (!pool || pool.wallet_id !== walletId) {
        throw new Error('Pool not found or unauthorized');
      }

      const closed = await LiquidityPoolModel.closePool(poolId);
      logger.info(`Liquidity removed from pool: ${poolId}`);
      return closed;
    } catch (error) {
      logger.error('Error removing liquidity:', error);
      throw error;
    }
  }
}

module.exports = new LiquidityPoolService();
