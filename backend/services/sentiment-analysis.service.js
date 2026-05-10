const { SentimentModel, SocialSignalModel } = require('../models/sentiment.model');
const logger = require('../utils/logger');

class SentimentAnalysisService {
  // Record sentiment for a token
  async recordSentiment(sentimentData) {
    try {
      const sentiment = await SentimentModel.recordSentiment(sentimentData);
      logger.info(`Sentiment recorded for ${sentimentData.token_symbol}`);
      return sentiment;
    } catch (error) {
      logger.error('Error recording sentiment:', error);
      throw error;
    }
  }

  // Get latest sentiment for a token
  async getLatestSentiment(tokenMint) {
    try {
      const sentiment = await SentimentModel.getLatestSentiment(tokenMint);
      return sentiment;
    } catch (error) {
      logger.error('Error fetching latest sentiment:', error);
      throw error;
    }
  }

  // Get bullish tokens (sentiment-based opportunities)
  async getBullishOpportunities(hoursBack = 24) {
    try {
      const bullish = await SentimentModel.getBullishTokens(hoursBack);
      return bullish.map(token => ({
        ...token,
        opportunity_score: this.calculateOpportunityScore(token)
      }));
    } catch (error) {
      logger.error('Error fetching bullish opportunities:', error);
      throw error;
    }
  }

  // Get sentiment trend for a token
  async getSentimentTrend(tokenMint, hoursBack = 168) {
    try {
      const trend = await SentimentModel.getSentimentTrend(tokenMint, hoursBack);
      return {
        token_mint: tokenMint,
        trend_data: trend,
        direction: this.determineTrendDirection(trend),
        momentum: this.calculateMomentum(trend)
      };
    } catch (error) {
      logger.error('Error fetching sentiment trend:', error);
      throw error;
    }
  }

  // Calculate opportunity score
  calculateOpportunityScore(sentiment) {
    const sentimentScore = sentiment.overall_sentiment * 50 + 50; // 0-100
    const mentionScore = Math.min(sentiment.mention_count / 100 * 50, 50);
    const influencerScore = Math.min(sentiment.influencer_mentions / 5 * 50, 50);
    
    return (sentimentScore * 0.5 + mentionScore * 0.3 + influencerScore * 0.2).toFixed(2);
  }

  // Determine trend direction
  determineTrendDirection(trendData) {
    if (trendData.length < 2) return 'insufficient_data';
    
    const first = trendData[0].overall_sentiment;
    const last = trendData[trendData.length - 1].overall_sentiment;
    
    if (last > first) return 'bullish';
    if (last < first) return 'bearish';
    return 'neutral';
  }

  // Calculate momentum
  calculateMomentum(trendData) {
    if (trendData.length < 2) return 0;
    
    const last = trendData[trendData.length - 1].overall_sentiment;
    const prev = trendData[Math.max(0, trendData.length - 7)].overall_sentiment;
    
    return (last - prev).toFixed(4);
  }
}

class SocialSignalService {
  // Record a social signal
  async recordSignal(signalData) {
    try {
      const signal = await SocialSignalModel.recordSignal(signalData);
      logger.info(`Social signal recorded: ${signalData.signal_type}`);
      return signal;
    } catch (error) {
      logger.error('Error recording signal:', error);
      throw error;
    }
  }

  // Get recent high-quality signals
  async getHighQualitySignals(hoursBack = 24) {
    try {
      const signals = await SocialSignalModel.getRecentSignals(hoursBack, 75); // Min strength 75
      return signals.map(signal => ({
        ...signal,
        quality_score: this.calculateSignalQuality(signal),
        action_recommendation: this.getActionRecommendation(signal)
      }));
    } catch (error) {
      logger.error('Error fetching high-quality signals:', error);
      throw error;
    }
  }

  // Get whale movement signals (high impact)
  async getWhaleSignals(hoursBack = 24) {
    try {
      const signals = await SocialSignalModel.getWhalesignals(hoursBack);
      return signals.map(signal => ({
        ...signal,
        impact_level: 'high',
        market_potential: this.assessMarketPotential(signal)
      }));
    } catch (error) {
      logger.error('Error fetching whale signals:', error);
      throw error;
    }
  }

  // Get signals for a specific token
  async getTokenSignals(tokenMint, hoursBack = 168) {
    try {
      const signals = await SocialSignalModel.getTokenSignals(tokenMint, hoursBack);
      
      // Aggregate signals
      const aggregate = this.aggregateSignals(signals);
      
      return {
        token_mint: tokenMint,
        signals: signals,
        aggregate_sentiment: aggregate.sentiment,
        signal_count: signals.length,
        avg_strength: aggregate.avgStrength
      };
    } catch (error) {
      logger.error('Error fetching token signals:', error);
      throw error;
    }
  }

  // Calculate signal quality
  calculateSignalQuality(signal) {
    const strengthFactor = signal.signal_strength / 100;
    const sourceFactor = this.getSourceReliability(signal.source_platform);
    
    return (strengthFactor * 0.6 + sourceFactor * 0.4).toFixed(2);
  }

  // Get source reliability score
  getSourceReliability(platform) {
    const scores = {
      'twitter': 0.8,
      'discord': 0.7,
      'reddit': 0.6,
      'on_chain': 0.95
    };
    return scores[platform] || 0.5;
  }

  // Get action recommendation
  getActionRecommendation(signal) {
    if (signal.signal_strength > 85) {
      return 'STRONG_BUY';
    } else if (signal.signal_strength > 70) {
      return 'BUY';
    } else if (signal.signal_strength > 50) {
      return 'HOLD';
    } else {
      return 'MONITOR';
    }
  }

  // Assess market potential
  assessMarketPotential(signal) {
    if (signal.signal_type === 'whale_movement') {
      return 'high_impact';
    } else if (signal.signal_type === 'influencer_mention') {
      return 'medium_impact';
    } else {
      return 'low_impact';
    }
  }

  // Aggregate signals for token
  aggregateSignals(signals) {
    const totalStrength = signals.reduce((sum, s) => sum + s.signal_strength, 0);
    const avgStrength = signals.length > 0 ? totalStrength / signals.length : 0;
    
    const bullishCount = signals.filter(s => s.signal_type === 'whale_movement').length;
    const sentiment = bullishCount > signals.length / 2 ? 'bullish' : 'bearish';
    
    return { sentiment, avgStrength };
  }
}

module.exports = { SentimentAnalysisService: new SentimentAnalysisService(), SocialSignalService: new SocialSignalService() };
