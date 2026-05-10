const logger = require('../utils/logger');
const cacheService = require('./cache.service');
const { query } = require('../db/connection');

class VolatilityService {
  constructor() {
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache
    this.minDataPoints = 10; // Minimum price points for calculation
  }

  /**
   * Calculate token volatility based on recent price movements
   * @param {string} tokenMint - Token mint address
   * @returns {Promise<Object>} Volatility metrics
   */
  async calculateVolatility(tokenMint) {
    try {
      const cacheKey = `volatility:${tokenMint}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get recent price data (last 24 hours, hourly intervals)
      const priceData = await this.getPriceHistory(tokenMint, 24);

      if (!priceData || priceData.length < this.minDataPoints) {
        logger.warn(`Insufficient price data for ${tokenMint} volatility calculation`);
        return {
          volatility: 0.05, // Default 5% volatility
          confidence: 'low',
          dataPoints: priceData?.length || 0
        };
      }

      // Calculate returns
      const returns = [];
      for (let i = 1; i < priceData.length; i++) {
        const prevPrice = priceData[i - 1].price;
        const currPrice = priceData[i].price;
        if (prevPrice > 0) {
          returns.push((currPrice - prevPrice) / prevPrice);
        }
      }

      // Calculate volatility (standard deviation of returns)
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);

      // Classify volatility level
      let volatilityLevel = 'low';
      if (volatility > 0.1) volatilityLevel = 'high';
      else if (volatility > 0.05) volatilityLevel = 'medium';

      const result = {
        volatility: Math.max(volatility, 0.01), // Minimum 1% volatility
        volatilityLevel,
        confidence: priceData.length >= 20 ? 'high' : 'medium',
        dataPoints: priceData.length,
        lastUpdated: new Date().toISOString()
      };

      // Cache result
      await cacheService.set(cacheKey, JSON.stringify(result), this.cacheTTL);

      logger.info(`Calculated volatility for ${tokenMint}: ${volatility.toFixed(4)} (${volatilityLevel})`);
      return result;

    } catch (error) {
      logger.error(`Volatility calculation failed for ${tokenMint}:`, error);
      return {
        volatility: 0.05, // Fallback
        volatilityLevel: 'medium',
        confidence: 'low',
        error: error.message
      };
    }
  }

  /**
   * Get price history for volatility calculation
   * @param {string} tokenMint - Token mint address
   * @param {number} hours - Hours of history
   * @returns {Promise<Array>} Price data points
   */
  async getPriceHistory(tokenMint, hours = 24) {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

      const result = await query(`
        SELECT price_usd, created_at
        FROM price_history
        WHERE token_mint = $1
          AND created_at >= $2
        ORDER BY created_at ASC
      `, [tokenMint, cutoff]);

      return result.rows.map(row => ({
        price: parseFloat(row.price_usd),
        timestamp: row.created_at
      }));

    } catch (error) {
      logger.error(`Failed to get price history for ${tokenMint}:`, error);
      return [];
    }
  }

  /**
   * Calculate dynamic stop loss percentage based on volatility
   * @param {number} baseStopLoss - Base stop loss percentage (e.g., 0.05 for 5%)
   * @param {number} volatility - Token volatility
   * @returns {number} Adjusted stop loss percentage
   */
  calculateDynamicStopLoss(baseStopLoss, volatility) {
    // Higher volatility = wider stop loss to avoid premature exits
    // Lower volatility = tighter stop loss for better risk control
    const adjustmentFactor = Math.max(0.5, Math.min(2.0, volatility / 0.05)); // 0.5x to 2x based on 5% baseline
    const dynamicStopLoss = baseStopLoss * adjustmentFactor;

    // Cap at reasonable limits
    return Math.max(0.01, Math.min(0.20, dynamicStopLoss)); // 1% to 20%
  }

  /**
   * Get volatility-adjusted risk parameters
   * @param {string} tokenMint - Token mint address
   * @param {Object} baseParams - Base risk parameters
   * @returns {Promise<Object>} Adjusted parameters
   */
  async getAdjustedRiskParams(tokenMint, baseParams = {}) {
    const volatilityData = await this.calculateVolatility(tokenMint);

    const adjustedParams = {
      ...baseParams,
      volatility: volatilityData.volatility,
      volatilityLevel: volatilityData.volatilityLevel,
      stopLossPercent: this.calculateDynamicStopLoss(
        baseParams.stopLossPercent || 0.05,
        volatilityData.volatility
      ),
      takeProfitMultiplier: this.calculateTakeProfitMultiplier(volatilityData.volatility),
      confidence: volatilityData.confidence
    };

    return adjustedParams;
  }

  /**
   * Calculate take profit multiplier based on volatility
   * @param {number} volatility - Token volatility
   * @returns {number} Take profit multiplier
   */
  calculateTakeProfitMultiplier(volatility) {
    // Higher volatility = higher potential returns, so adjust take profit targets
    if (volatility > 0.1) return 3.0; // 300% for high volatility
    if (volatility > 0.05) return 2.0; // 200% for medium
    return 1.5; // 150% for low volatility
  }
}

module.exports = new VolatilityService();