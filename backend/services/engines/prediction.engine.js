const axios = require('axios');
const logger = require('../../utils/logger');

class PredictionEngine {
  constructor() {
    this.modelName = 'placeholder-signal-model';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.aiServiceEnabled = process.env.AI_SERVICE_ENABLED === 'true';
  }

  async scoreTrade(tokenMint, metadata = {}) {
    try {
      // Try external AI service first if enabled
      if (this.aiServiceEnabled) {
        try {
          const aiResponse = await axios.post(`${this.aiServiceUrl}/predict`, {
            tokenMint,
            metadata,
          }, {
            timeout: 5000, // 5 second timeout for AI service
          });

          if (aiResponse.data && aiResponse.data.score !== undefined) {
            logger.info(`AI prediction for ${tokenMint}: ${aiResponse.data.score}`);
            return {
              tokenMint,
              model: aiResponse.data.model || 'external-ai',
              score: aiResponse.data.score,
              recommendation: aiResponse.data.recommendation || this.getRecommendation(aiResponse.data.score),
              confidence: aiResponse.data.confidence || (aiResponse.data.score / 100),
              metadataSummary: {
                name: metadata.name || 'unknown',
                symbol: metadata.symbol || 'unknown',
              },
            };
          }
        } catch (aiError) {
          logger.warn('AI service unavailable, falling back to placeholder:', aiError.message);
        }
      }

      // Fallback to placeholder scoring logic
      const baseScore = Math.floor(Math.random() * 100);
      const recommendation = this.getRecommendation(baseScore);

      const signal = {
        tokenMint,
        model: this.modelName,
        score: baseScore,
        recommendation,
        confidence: +(baseScore / 100).toFixed(2),
        metadataSummary: {
          name: metadata.name || 'unknown',
          symbol: metadata.symbol || 'unknown',
        },
      };

      logger.info(`Prediction score for ${tokenMint}: ${signal.score}`);
      return signal;
    } catch (error) {
      logger.error('Prediction scoring error:', error);
      return {
        tokenMint,
        model: this.modelName,
        score: 0,
        recommendation: 'UNKNOWN',
        confidence: 0,
      };
    }
  }

  getRecommendation(score) {
    if (score >= 70) return 'BUY';
    if (score >= 40) return 'HOLD';
    return 'SELL';
  }
}

module.exports = new PredictionEngine();