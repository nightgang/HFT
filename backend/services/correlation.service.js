const logger = require('../utils/logger');
const cacheService = require('./cache.service');

class CorrelationAnalysisService {
  constructor() {
    this.correlationWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.minDataPoints = 10;
  }

  /**
   * Analyze correlation between token pairs
   * @param {string} tokenA - First token mint
   * @param {string} tokenB - Second token mint
   * @returns {Promise<Object>} Correlation analysis result
   */
  async analyzeTokenCorrelation(tokenA, tokenB) {
    try {
      logger.info(`📊 Analyzing correlation between ${tokenA} and ${tokenB}`);

      // Get historical price data for both tokens
      const priceDataA = await this.getHistoricalPrices(tokenA);
      const priceDataB = await this.getHistoricalPrices(tokenB);

      if (!priceDataA || !priceDataB || priceDataA.length < this.minDataPoints || priceDataB.length < this.minDataPoints) {
        return {
          tokenA,
          tokenB,
          correlation: null,
          confidence: 0,
          dataPoints: Math.min(priceDataA?.length || 0, priceDataB?.length || 0),
          error: 'Insufficient data points'
        };
      }

      // Align timestamps and calculate returns
      const alignedData = this.alignPriceData(priceDataA, priceDataB);
      const returnsA = this.calculateReturns(alignedData.pricesA);
      const returnsB = this.calculateReturns(alignedData.pricesB);

      // Calculate Pearson correlation coefficient
      const correlation = this.calculatePearsonCorrelation(returnsA, returnsB);

      // Calculate confidence based on data quality
      const confidence = this.calculateConfidence(alignedData.pricesA.length, correlation);

      const result = {
        tokenA,
        tokenB,
        correlation: Math.round(correlation * 1000) / 1000, // Round to 3 decimal places
        confidence: Math.round(confidence * 100) / 100,
        dataPoints: alignedData.pricesA.length,
        timeWindow: this.correlationWindow,
        analysis: this.interpretCorrelation(correlation),
        timestamp: Date.now()
      };

      // Cache result for 1 hour
      const cacheKey = `correlation:${tokenA}:${tokenB}`;
      await cacheService.set(cacheKey, result, 3600);

      logger.info(`📊 Correlation analysis complete: ${tokenA} ↔ ${tokenB} = ${result.correlation} (${result.confidence}% confidence)`);

      return result;

    } catch (error) {
      logger.error(`Error analyzing correlation between ${tokenA} and ${tokenB}:`, error);
      return {
        tokenA,
        tokenB,
        correlation: null,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Get historical price data for a token
   * @param {string} tokenMint - Token mint address
   * @returns {Promise<Array>} Array of {timestamp, price} objects
   */
  async getHistoricalPrices(tokenMint) {
    try {
      // In a real implementation, this would fetch from a price history database
      // For now, we'll simulate with cached price data
      const cacheKey = `price_history:${tokenMint}`;
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        return cachedData;
      }

      // Simulate price history (replace with actual data source)
      const mockData = this.generateMockPriceHistory(tokenMint);

      // Cache for 5 minutes
      await cacheService.set(cacheKey, mockData, 300);

      return mockData;

    } catch (error) {
      logger.error(`Error getting price history for ${tokenMint}:`, error);
      return null;
    }
  }

  /**
   * Generate mock price history for demonstration
   * @param {string} tokenMint - Token mint
   * @returns {Array} Mock price data
   */
  generateMockPriceHistory(tokenMint) {
    const data = [];
    const now = Date.now();
    const hours = 24;

    // Use token mint as seed for consistent but varied data
    const seed = tokenMint.slice(-8);
    let basePrice = 0.001;

    for (let i = hours; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000);
      // Generate somewhat realistic price movement
      const randomFactor = (parseInt(seed, 16) % 100) / 100;
      const volatility = 0.1 + (randomFactor * 0.2);
      const change = (Math.random() - 0.5) * volatility;
      basePrice *= (1 + change);

      data.push({
        timestamp,
        price: Math.max(0.0001, basePrice) // Ensure positive price
      });
    }

    return data;
  }

  /**
   * Align price data by timestamps
   * @param {Array} dataA - Price data for token A
   * @param {Array} dataB - Price data for token B
   * @returns {Object} Aligned price arrays
   */
  alignPriceData(dataA, dataB) {
    const alignedA = [];
    const alignedB = [];

    // Simple alignment by finding closest timestamps
    dataA.forEach(pointA => {
      const closestB = dataB.reduce((closest, pointB) => {
        const diffA = Math.abs(pointA.timestamp - closest.timestamp);
        const diffB = Math.abs(pointA.timestamp - pointB.timestamp);
        return diffB < diffA ? pointB : closest;
      });

      if (Math.abs(pointA.timestamp - closestB.timestamp) < 300000) { // Within 5 minutes
        alignedA.push(pointA.price);
        alignedB.push(closestB.price);
      }
    });

    return { pricesA: alignedA, pricesB: alignedB };
  }

  /**
   * Calculate price returns from price series
   * @param {Array} prices - Array of prices
   * @returns {Array} Array of returns
   */
  calculateReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const return_pct = (prices[i] - prices[i-1]) / prices[i-1];
      returns.push(return_pct);
    }
    return returns;
  }

  /**
   * Calculate Pearson correlation coefficient
   * @param {Array} x - First data series
   * @param {Array} y - Second data series
   * @returns {number} Correlation coefficient
   */
  calculatePearsonCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate confidence in correlation result
   * @param {number} dataPoints - Number of data points
   * @param {number} correlation - Correlation coefficient
   * @returns {number} Confidence percentage
   */
  calculateConfidence(dataPoints, correlation) {
    // Simple confidence calculation based on sample size and correlation strength
    const sampleConfidence = Math.min(dataPoints / this.minDataPoints, 1) * 0.7;
    const strengthConfidence = Math.abs(correlation) * 0.3;
    return (sampleConfidence + strengthConfidence) * 100;
  }

  /**
   * Interpret correlation coefficient
   * @param {number} correlation - Correlation coefficient
   * @returns {string} Human-readable interpretation
   */
  interpretCorrelation(correlation) {
    const absCorr = Math.abs(correlation);

    if (absCorr >= 0.8) {
      return correlation > 0 ? 'Very strong positive correlation' : 'Very strong negative correlation';
    } else if (absCorr >= 0.6) {
      return correlation > 0 ? 'Strong positive correlation' : 'Strong negative correlation';
    } else if (absCorr >= 0.3) {
      return correlation > 0 ? 'Moderate positive correlation' : 'Moderate negative correlation';
    } else if (absCorr >= 0.1) {
      return correlation > 0 ? 'Weak positive correlation' : 'Weak negative correlation';
    } else {
      return 'No significant correlation';
    }
  }

  /**
   * Get correlated token pairs for a given token
   * @param {string} tokenMint - Base token mint
   * @param {Array} candidateTokens - Array of candidate token mints
   * @returns {Promise<Array>} Array of correlation results
   */
  async getCorrelatedPairs(tokenMint, candidateTokens) {
    const results = [];

    for (const candidate of candidateTokens) {
      if (candidate !== tokenMint) {
        const correlation = await this.analyzeTokenCorrelation(tokenMint, candidate);
        results.push(correlation);
      }
    }

    // Sort by absolute correlation strength
    results.sort((a, b) => Math.abs(b.correlation || 0) - Math.abs(a.correlation || 0));

    return results.slice(0, 10); // Return top 10
  }
}

module.exports = new CorrelationAnalysisService();