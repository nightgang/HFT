const { query } = require('../db/connection');
const logger = require('../utils/logger');

class SentimentModel {
  // Record sentiment scores for a token
  static async recordSentiment(sentimentData) {
    const {
      token_mint,
      token_symbol,
      overall_sentiment,
      twitter_sentiment,
      discord_sentiment,
      reddit_sentiment,
      mention_count,
      influencer_mentions,
      sentiment_trend,
      trend_velocity,
      data_source
    } = sentimentData;

    const sql = `
      INSERT INTO sentiment_scores (
        token_mint, token_symbol, overall_sentiment, twitter_sentiment,
        discord_sentiment, reddit_sentiment, mention_count, influencer_mentions,
        sentiment_trend, trend_velocity, data_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      token_mint, token_symbol, overall_sentiment, twitter_sentiment,
      discord_sentiment, reddit_sentiment, mention_count, influencer_mentions,
      sentiment_trend, trend_velocity, data_source
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Sentiment recorded for ${token_symbol}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording sentiment:', error);
      throw error;
    }
  }

  // Get latest sentiment for a token
  static async getLatestSentiment(token_mint) {
    const sql = `
      SELECT * FROM sentiment_scores
      WHERE token_mint = $1
      ORDER BY recorded_at DESC
      LIMIT 1
    `;
    try {
      const result = await query(sql, [token_mint]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching latest sentiment:', error);
      throw error;
    }
  }

  // Get bullish tokens
  static async getBullishTokens(hoursBack = 24) {
    const sql = `
      SELECT DISTINCT ON (token_mint) * FROM sentiment_scores
      WHERE recorded_at >= CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
      AND sentiment_trend = 'bullish'
      ORDER BY token_mint, recorded_at DESC
    `;
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching bullish tokens:', error);
      throw error;
    }
  }

  // Get sentiment trend for a token
  static async getSentimentTrend(token_mint, hoursBack = 168) {
    const sql = `
      SELECT * FROM sentiment_scores
      WHERE token_mint = $1
      AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
      ORDER BY recorded_at ASC
    `;
    try {
      const result = await query(sql, [token_mint]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching sentiment trend:', error);
      throw error;
    }
  }
}

class SocialSignalModel {
  // Record a social signal
  static async recordSignal(signalData) {
    const {
      token_mint,
      token_symbol,
      signal_type,
      signal_strength,
      source_platform,
      source_account,
      signal_content,
      signal_link
    } = signalData;

    const sql = `
      INSERT INTO social_signals (
        token_mint, token_symbol, signal_type, signal_strength,
        source_platform, source_account, signal_content, signal_link
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      token_mint, token_symbol, signal_type, signal_strength,
      source_platform, source_account, signal_content, signal_link
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Social signal recorded: ${signal_type} for ${token_symbol}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording social signal:', error);
      throw error;
    }
  }

  // Get recent signals for tokens
  static async getRecentSignals(hoursBack = 24, minStrength = 50) {
    const sql = `
      SELECT * FROM social_signals
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
      AND signal_strength >= $1
      ORDER BY signal_strength DESC, created_at DESC
    `;
    try {
      const result = await query(sql, [minStrength]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching recent signals:', error);
      throw error;
    }
  }

  // Get whale movement signals
  static async getWhalesignals(hoursBack = 24) {
    const sql = `
      SELECT * FROM social_signals
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
      AND signal_type = 'whale_movement'
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching whale signals:', error);
      throw error;
    }
  }

  // Get signals for specific token
  static async getTokenSignals(token_mint, hoursBack = 168) {
    const sql = `
      SELECT * FROM social_signals
      WHERE token_mint = $1
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${hoursBack} hours'
      ORDER BY signal_strength DESC, created_at DESC
    `;
    try {
      const result = await query(sql, [token_mint]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching token signals:', error);
      throw error;
    }
  }
}

module.exports = { SentimentModel, SocialSignalModel };
