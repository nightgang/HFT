const { query } = require('../../db/connection');
const logger = require('../../utils/logger');
const metricsService = require('../monitoring/metrics.service');
const volatilityService = require('../volatility.service');

class RiskManagementService {
  constructor() {
    // Risk limits configuration
    this.limits = {
      dailyLossLimit: -0.05, // -5% daily loss limit
      maxPositionSize: 1000, // Max $1000 position per wallet
      maxTradesPerHour: 100,
      maxTradesPerDay: 500,
      cooldownPeriodMs: 30000, // 30 seconds cooldown after failed trade
      maxExposurePercent: 10, // Max 10% of portfolio in single token
      minTradeIntervalMs: 1000 // Minimum 1 second between trades
    };

    // Risk state tracking
    this.walletStates = new Map();
    this.tokenExposures = new Map();
  }

  // Check if wallet can execute trade
  async canExecuteTrade(walletId, tradeParams) {
    try {
      const checks = await Promise.all([
        this.checkDailyLossLimit(walletId),
        this.checkPositionSizeLimit(walletId, tradeParams),
        this.checkTradeFrequencyLimit(walletId),
        this.checkCooldownPeriod(walletId),
        this.checkPortfolioExposure(walletId, tradeParams),
        this.checkTradeInterval(walletId)
      ]);

      const violations = checks.filter(check => !check.allowed);

      if (violations.length > 0) {
        // Log violations
        for (const violation of violations) {
          await this.logRiskViolation(walletId, violation.type, violation.details);
          metricsService.recordRiskViolation(violation.type, 'medium');
        }

        return {
          allowed: false,
          violations: violations.map(v => ({ type: v.type, message: v.message }))
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Risk check failed:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Check daily loss limit
  async checkDailyLossLimit(walletId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await query(`
        SELECT
          COALESCE(SUM(pnl_usd), 0) as daily_pnl,
          COUNT(*) as trade_count
        FROM trades
        WHERE wallet_id = $1
          AND created_at >= $2
          AND status IN ('completed', 'failed')
      `, [walletId, today]);

      const { daily_pnl, trade_count } = result.rows[0];
      const lossFraction = trade_count > 0 ? (daily_pnl / this.limits.maxPositionSize) : 0;
      const lossPercent = lossFraction * 100;

      if (lossFraction <= this.limits.dailyLossLimit) {
        return {
          allowed: false,
          type: 'daily_loss_limit',
          message: `Daily loss limit exceeded: ${lossPercent.toFixed(2)}% (limit: ${this.limits.dailyLossLimit * 100}%)`,
          details: { dailyPnl: daily_pnl, lossFraction, lossPercent, limit: this.limits.dailyLossLimit }
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Daily loss limit check failed:', error);
      return { allowed: false, type: 'system_error', message: 'Failed to check daily loss limit' };
    }
  }

  // Check position size limit
  async checkPositionSizeLimit(walletId, tradeParams) {
    try {
      const { amountIn, tokenIn } = tradeParams;

      // Get current position for this token
      const balanceResult = await query(`
        SELECT COALESCE(balance, 0) as current_balance
        FROM wallet_balances
        WHERE wallet_id = $1 AND token_mint = $2
      `, [walletId, tokenIn.mint]);

      const currentBalance = balanceResult.rows[0]?.current_balance || 0;
      const newPositionSize = currentBalance + amountIn;

      // Convert to USD value (simplified - would need price feed)
      const usdValue = newPositionSize * 0.00001; // Mock conversion

      if (usdValue > this.limits.maxPositionSize) {
        return {
          allowed: false,
          type: 'position_size_limit',
          message: `Position size limit exceeded: $${usdValue.toFixed(2)} (limit: $${this.limits.maxPositionSize})`,
          details: { currentBalance, newPositionSize, usdValue, limit: this.limits.maxPositionSize }
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Position size limit check failed:', error);
      return { allowed: false, type: 'system_error', message: 'Failed to check position size limit' };
    }
  }

  // Check trade frequency limits
  async checkTradeFrequencyLimit(walletId) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const result = await query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at >= $2) as trades_last_hour,
          COUNT(*) FILTER (WHERE created_at >= $3) as trades_last_day
        FROM trades
        WHERE wallet_id = $1
      `, [walletId, oneHourAgo, oneDayAgo]);

      const { trades_last_hour, trades_last_day } = result.rows[0];

      if (trades_last_hour >= this.limits.maxTradesPerHour) {
        return {
          allowed: false,
          type: 'trade_frequency_limit',
          message: `Hourly trade limit exceeded: ${trades_last_hour} trades (limit: ${this.limits.maxTradesPerHour})`,
          details: { tradesLastHour: trades_last_hour, limit: this.limits.maxTradesPerHour }
        };
      }

      if (trades_last_day >= this.limits.maxTradesPerDay) {
        return {
          allowed: false,
          type: 'trade_frequency_limit',
          message: `Daily trade limit exceeded: ${trades_last_day} trades (limit: ${this.limits.maxTradesPerDay})`,
          details: { tradesLastDay: trades_last_day, limit: this.limits.maxTradesPerDay }
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Trade frequency limit check failed:', error);
      return { allowed: false, type: 'system_error', message: 'Failed to check trade frequency limit' };
    }
  }

  // Check cooldown period after failed trades
  async checkCooldownPeriod(walletId) {
    try {
      const result = await query(`
        SELECT created_at, status
        FROM trades
        WHERE wallet_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [walletId]);

      if (result.rows.length === 0) return { allowed: true };

      const lastTrade = result.rows[0];
      if (lastTrade.status !== 'failed') return { allowed: true };

      const timeSinceLastFailure = Date.now() - new Date(lastTrade.created_at).getTime();

      if (timeSinceLastFailure < this.limits.cooldownPeriodMs) {
        const remainingCooldown = this.limits.cooldownPeriodMs - timeSinceLastFailure;
        return {
          allowed: false,
          type: 'cooldown_period',
          message: `Cooldown period active. Wait ${Math.ceil(remainingCooldown / 1000)} seconds.`,
          details: { remainingCooldown, cooldownPeriod: this.limits.cooldownPeriodMs }
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Cooldown period check failed:', error);
      return { allowed: false, type: 'system_error', message: 'Failed to check cooldown period' };
    }
  }

  // Check portfolio exposure limits
  async checkPortfolioExposure(walletId, tradeParams) {
    try {
      const { amountIn, tokenIn } = tradeParams;

      // Get total portfolio value
      const portfolioResult = await query(`
        SELECT COALESCE(SUM(balance * 0.00001), 0) as portfolio_value_usd
        FROM wallet_balances
        WHERE wallet_id = $1 AND balance > 0
      `, [walletId]);

      const portfolioValue = portfolioResult.rows[0]?.portfolio_value_usd || 0;

      // Get current exposure to this token
      const exposureResult = await query(`
        SELECT COALESCE(balance * 0.00001, 0) as token_exposure_usd
        FROM wallet_balances
        WHERE wallet_id = $1 AND token_mint = $2
      `, [walletId, tokenIn.mint]);

      const currentExposure = exposureResult.rows[0]?.token_exposure_usd || 0;
      const newExposure = currentExposure + (amountIn * 0.00001);
      const exposurePercent = portfolioValue > 0 ? (newExposure / portfolioValue) * 100 : 100;

      if (exposurePercent > this.limits.maxExposurePercent) {
        return {
          allowed: false,
          type: 'portfolio_exposure_limit',
          message: `Portfolio exposure limit exceeded: ${exposurePercent.toFixed(2)}% (limit: ${this.limits.maxExposurePercent}%)`,
          details: { currentExposure, newExposure, exposurePercent, limit: this.limits.maxExposurePercent }
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Portfolio exposure check failed:', error);
      return { allowed: false, type: 'system_error', message: 'Failed to check portfolio exposure' };
    }
  }

  // Check minimum trade interval
  async checkTradeInterval(walletId) {
    try {
      const result = await query(`
        SELECT created_at
        FROM trades
        WHERE wallet_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [walletId]);

      if (result.rows.length === 0) return { allowed: true };

      const lastTradeTime = new Date(result.rows[0].created_at).getTime();
      const timeSinceLastTrade = Date.now() - lastTradeTime;

      if (timeSinceLastTrade < this.limits.minTradeIntervalMs) {
        return {
          allowed: false,
          type: 'trade_interval_limit',
          message: `Minimum trade interval not met. Wait ${Math.ceil((this.limits.minTradeIntervalMs - timeSinceLastTrade) / 1000)} seconds.`,
          details: { timeSinceLastTrade, minInterval: this.limits.minTradeIntervalMs }
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Trade interval check failed:', error);
      return { allowed: false, type: 'system_error', message: 'Failed to check trade interval' };
    }
  }

  // Log risk violation
  async logRiskViolation(walletId, violationType, details) {
    try {
      await query(`
        INSERT INTO risk_violations (
          wallet_id, violation_type, severity, limit_value, actual_value, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        walletId,
        violationType,
        'medium',
        details?.limit || 0,
        details?.actual || 0,
        JSON.stringify(details || {})
      ]);

      logger.warn(`Risk violation logged: ${violationType} for wallet ${walletId}`, details);
    } catch (error) {
      logger.error('Failed to log risk violation:', error);
    }
  }

  // Calculate risk score for wallet
  async calculateRiskScore(walletId) {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get trading statistics
      const statsResult = await query(`
        SELECT
          COUNT(*) as total_trades,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_trades,
          COUNT(*) FILTER (WHERE pnl_usd < 0) as losing_trades,
          COALESCE(SUM(pnl_usd), 0) as total_pnl,
          COALESCE(AVG(pnl_usd), 0) as avg_pnl
        FROM trades
        WHERE wallet_id = $1 AND created_at >= $2
      `, [walletId, sevenDaysAgo]);

      const stats = statsResult.rows[0];

      // Get risk violations
      const violationsResult = await query(`
        SELECT COUNT(*) as violation_count
        FROM risk_violations
        WHERE wallet_id = $1 AND created_at >= $2
      `, [walletId, sevenDaysAgo]);

      const violationCount = violationsResult.rows[0]?.violation_count || 0;

      // Calculate risk score (0-100, higher = riskier)
      let riskScore = 0;

      // Failure rate component (0-40 points)
      const failureRate = stats.total_trades > 0 ? (stats.failed_trades / stats.total_trades) * 100 : 0;
      riskScore += Math.min(failureRate * 0.4, 40);

      // Loss rate component (0-30 points)
      const lossRate = stats.total_trades > 0 ? (stats.losing_trades / stats.total_trades) * 100 : 0;
      riskScore += Math.min(lossRate * 0.3, 30);

      // Violation component (0-20 points)
      const violationScore = Math.min(violationCount * 2, 20);
      riskScore += violationScore;

      // PnL volatility component (0-10 points)
      const pnlVolatility = Math.abs(stats.avg_pnl) > 100 ? 10 : Math.abs(stats.avg_pnl) / 10;
      riskScore += pnlVolatility;

      return {
        walletId,
        riskScore: Math.min(Math.round(riskScore), 100),
        components: {
          failureRate,
          lossRate,
          violationCount,
          pnlVolatility: pnlVolatility * 10
        },
        stats
      };
    } catch (error) {
      logger.error('Risk score calculation failed:', error);
      return { walletId, riskScore: 50, error: error.message }; // Default medium risk
    }
  }

  // Update risk limits (admin function)
  updateLimits(newLimits) {
    this.limits = { ...this.limits, ...newLimits };
    logger.info('Risk limits updated:', this.limits);
  }

  // Get current risk state for wallet
  async getWalletRiskState(walletId) {
    try {
      const riskScore = await this.calculateRiskScore(walletId);

      const state = {
        walletId,
        riskScore: riskScore.riskScore,
        riskLevel: this.getRiskLevel(riskScore.riskScore),
        limits: this.limits,
        lastUpdated: new Date()
      };

      return state;
    } catch (error) {
      logger.error('Failed to get wallet risk state:', error);
      return { walletId, error: error.message };
    }
  }

  // Get risk level description
  getRiskLevel(score) {
    if (score <= 20) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 80) return 'high';
    return 'critical';
  }

  /**
   * Get volatility-adjusted risk parameters for trading
   * @param {string} tokenMint - Token mint address
   * @param {Object} baseParams - Base risk parameters
   * @returns {Promise<Object>} Adjusted risk parameters
   */
  async getAdjustedRiskParams(tokenMint, baseParams = {}) {
    try {
      const adjustedParams = await volatilityService.getAdjustedRiskParams(tokenMint, {
        stopLossPercent: baseParams.stopLossPercent || 0.05, // 5% default
        takeProfitPercent: baseParams.takeProfitPercent || 0.20, // 20% default
        ...baseParams
      });

      logger.info(`Adjusted risk params for ${tokenMint}: stopLoss=${(adjustedParams.stopLossPercent * 100).toFixed(2)}%, volatility=${adjustedParams.volatilityLevel}`);

      return adjustedParams;
    } catch (error) {
      logger.error('Failed to get adjusted risk params:', error);
      return {
        stopLossPercent: 0.05,
        takeProfitPercent: 0.20,
        volatility: 0.05,
        volatilityLevel: 'medium',
        error: error.message
      };
    }
  }
}

module.exports = new RiskManagementService();
module.exports.RiskManagementService = RiskManagementService;