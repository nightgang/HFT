/**
 * AI Service service
 * Handles AI-powered features and predictions
 */

import api from './api';

class AIService {
  /**
   * Get AI recommendations
   */
  async getRecommendations() {
    try {
      return await api.get('/ai/recommendations');
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      throw error;
    }
  }

  /**
   * Get AI analysis for token
   */
  async getTokenAnalysis(tokenMint) {
    try {
      return await api.get(`/ai/token-analysis/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch token analysis:', error);
      throw error;
    }
  }

  /**
   * Get portfolio recommendations
   */
  async getPortfolioRecommendations() {
    try {
      return await api.get('/ai/portfolio-recommendations');
    } catch (error) {
      console.error('Failed to fetch portfolio recommendations:', error);
      throw error;
    }
  }

  /**
   * Get market insights
   */
  async getMarketInsights() {
    try {
      return await api.get('/ai/market-insights');
    } catch (error) {
      console.error('Failed to fetch market insights:', error);
      throw error;
    }
  }

  /**
   * Generate trading signal
   */
  async generateTradingSignal(tokenMint, timeframe = '1h') {
    try {
      return await api.post('/ai/trading-signal', {
        tokenMint,
        timeframe,
      });
    } catch (error) {
      console.error('Failed to generate trading signal:', error);
      throw error;
    }
  }

  /**
   * Get price prediction
   */
  async getPricePrediction(tokenMint, timeframe = '1h') {
    try {
      return await api.get(`/ai/price-prediction/${tokenMint}?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch price prediction:', error);
      throw error;
    }
  }

  /**
   * Get model performance
   */
  async getModelPerformance() {
    try {
      return await api.get('/ai/model-performance');
    } catch (error) {
      console.error('Failed to fetch model performance:', error);
      throw error;
    }
  }

  /**
   * Assess token risk
   */
  async assessRisk(tokenMint, metadata = {}, marketData = {}) {
    try {
      return await api.post('/ai/risk-assessment', {
        tokenMint,
        metadata,
        marketData,
      });
    } catch (error) {
      console.error('Failed to fetch risk assessment:', error);
      throw error;
    }
  }

  /**
   * Chat with AI
   */
  async chat(message) {
    try {
      return await api.post('/ai/chat', { message });
    } catch (error) {
      console.error('Failed to chat with AI:', error);
      throw error;
    }
  }
}

export default new AIService();
