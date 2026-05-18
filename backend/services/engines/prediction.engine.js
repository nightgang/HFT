const axios = require('axios');
const logger = require('../../utils/logger');
const { buildTraceHeaders } = require('../../utils/http.client');

class PredictionEngine {
  constructor() {
    this.modelName = 'placeholder-signal-model';
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.aiServiceEnabled = process.env.AI_SERVICE_ENABLED === 'true';
  }

  async scoreTrade(tokenMint, metadata = {}, requestId) {
    try {
      // Try external AI service first if enabled
      if (this.aiServiceEnabled) {
        try {
          const headers = buildTraceHeaders(requestId);
          if (process.env.AI_SERVICE_API_KEY) {
            headers['X-API-Key'] = process.env.AI_SERVICE_API_KEY;
          }

          const aiResponse = await axios.post(`${this.aiServiceUrl}/predict`, {
            tokenMint,
            metadata,
          }, {
            timeout: 5000, // 5 second timeout for AI service
            headers,
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

  async assessRisk(tokenMint, metadata = {}, requestId) {
    try {
      if (this.aiServiceEnabled) {
        try {
          const headers = buildTraceHeaders(requestId);
          if (process.env.AI_SERVICE_API_KEY) {
            headers['X-API-Key'] = process.env.AI_SERVICE_API_KEY;
          }

          const aiResponse = await axios.post(`${this.aiServiceUrl}/risk-assessment`, {
            tokenMint,
            metadata
          }, {
            timeout: 5000,
            headers,
          });

          if (aiResponse.data && aiResponse.data.riskScore !== undefined) {
            logger.info(`AI risk assessment for ${tokenMint}: ${aiResponse.data.riskScore}`);
            return {
              tokenMint,
              riskScore: aiResponse.data.riskScore,
              riskFactors: aiResponse.data.riskFactors || [],
              recommendation: aiResponse.data.recommendation || 'USE CAUTION',
              riskLevel: aiResponse.data.riskLevel || 'Medium',
            };
          }
        } catch (aiError) {
          logger.warn('AI risk service unavailable, falling back to placeholder:', aiError.message);
        }
      }

      return {
        tokenMint,
        riskScore: 50,
        riskFactors: ['fallback risk model'],
        recommendation: 'Use caution and verify market conditions before trading.',
        riskLevel: 'Medium',
      };
    } catch (error) {
      logger.error('Risk assessment error:', error);
      return {
        tokenMint,
        riskScore: 50,
        riskFactors: ['fallback risk model'],
        recommendation: 'Use caution.',
        riskLevel: 'Medium',
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