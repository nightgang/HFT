const LiquidityPoolModel = require('../models/liquidity-pool.model');
const logger = require('../utils/logger');

class LiquidityPoolService {
  // Create or update a liquidity pool
  async createOrUpdatePool(poolData) {
    try {
      const pool = await LiquidityPoolModel.createPool(poolData);
      logger.info(`Liquidity pool created/updated: ${pool.pool_id}`);
      return pool;
    } catch (error) {
      logger.error('Error creating liquidity pool:', error);
      throw error;
    }
  }

  // Add liquidity to a pool
  async addLiquidity(walletId, poolId, addLiquidityData) {
    try {
      const pool = await LiquidityPoolModel.getPoolById(poolId);
      if (!pool) {
        throw new Error('Pool not found');
      }

      // Create liquidity position
      const position = await LiquidityPoolModel.createPosition({
        pool_id: poolId,
        wallet_id: walletId,
        lp_token_mint: addLiquidityData.lp_token_mint,
        lp_token_balance: addLiquidityData.lp_token_balance,
        pool_share_percent: (addLiquidityData.lp_token_balance / addLiquidityData.pool_total_lp) * 100,
        token_a_contributed: addLiquidityData.token_a_amount,
        token_b_contributed: addLiquidityData.token_b_amount
      });

      logger.info(`Liquidity added to pool: ${poolId}`);
      return position;
    } catch (error) {
      logger.error('Error adding liquidity:', error);
      throw error;
    }
  }

  // Remove liquidity from a pool
  async removeLiquidity(walletId, positionId) {
    try {
      const position = await LiquidityPoolModel.closePosition(positionId);
      logger.info(`Liquidity removed from position: ${positionId}`);
      return position;
    } catch (error) {
      logger.error('Error removing liquidity:', error);
      throw error;
    }
  }

  // Claim fees from a position
  async claimFees(walletId, positionId) {
    try {
      const position = await LiquidityPoolModel.getPositionsByWallet(walletId);
      const targetPosition = position.find(p => p.position_id === positionId);
      
      if (!targetPosition) {
        throw new Error('Position not found');
      }

      const updatedPosition = await LiquidityPoolModel.claimFees(
        positionId,
        targetPosition.unclaimed_fees
      );

      logger.info(`Fees claimed: ${targetPosition.unclaimed_fees} from position ${positionId}`);
      return updatedPosition;
    } catch (error) {
      logger.error('Error claiming fees:', error);
      throw error;
    }
  }

  // Get all positions for wallet
  async getWalletPositions(walletId) {
    try {
      const positions = await LiquidityPoolModel.getPositionsByWallet(walletId);
      
      // Calculate yields and APY
      const enrichedPositions = positions.map(position => ({
        ...position,
        annualized_fee_yield: position.total_fees_earned > 0 
          ? ((position.total_fees_earned / 365) * 100) 
          : 0
      }));
      
      return enrichedPositions;
    } catch (error) {
      logger.error('Error fetching wallet positions:', error);
      throw error;
    }
  }

  // Calculate pool APY
  calculateAPY(pool, positionFees, daysActive) {
    if (daysActive === 0) return 0;
    const dailyYield = positionFees / daysActive;
    return (dailyYield / pool.total_liquidity_usd) * 365 * 100;
  }
}

module.exports = new LiquidityPoolService();
