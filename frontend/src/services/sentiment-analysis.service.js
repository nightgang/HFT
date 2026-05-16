/**
 * Sentiment Analysis service
 * Handles market sentiment analysis and social signals
 */

import api from './api';

class SentimentAnalysisService {
  /**
   * Get overall market sentiment
   */
  async getMarketSentiment() {
    try {
      return await api.get('/sentiment/market');
    } catch (error) {
      console.error('Failed to fetch market sentiment:', error);
      throw error;
    }
  }

  /**
   * Get sentiment for specific token
   */
  async getTokenSentiment(tokenMint) {
    try {
      return await api.get(`/sentiment/tokens/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch token sentiment:', error);
      throw error;
    }
  }

  /**
   * Get social signals
   */
  async getSocialSignals(tokenMint) {
    try {
      return await api.get(`/sentiment/social-signals/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch social signals:', error);
      throw error;
    }
  }

  /**
   * Get influencer sentiment
   */
  async getInfluencerSentiment(tokenMint) {
    try {
      return await api.get(`/sentiment/influencers/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch influencer sentiment:', error);
      throw error;
    }
  }

  /**
   * Get community sentiment
   */
  async getCommunitySentiment(tokenMint) {
    try {
      return await api.get(`/sentiment/community/${tokenMint}`);
    } catch (error) {
      console.error('Failed to fetch community sentiment:', error);
      throw error;
    }
  }

  /**
   * Get sentiment trends
   */
  async getSentimentTrends(tokenMint, timeframe = '7d') {
    try {
      return await api.get(`/sentiment/trends/${tokenMint}?timeframe=${timeframe}`);
    } catch (error) {
      console.error('Failed to fetch sentiment trends:', error);
      throw error;
    }
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(limit = 20) {
    try {
      return await api.get(`/sentiment/trending-topics?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch trending topics:', error);
      throw error;
    }
  }

  /**
   * Analyze text sentiment
   */
  async analyzeTextSentiment(text) {
    try {
      return await api.post('/sentiment/analyze', { text });
    } catch (error) {
      console.error('Failed to analyze text sentiment:', error);
      throw error;
    }
  }
}

export default new SentimentAnalysisService();
