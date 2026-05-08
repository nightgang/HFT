// Risk Limits and Portfolio Management Service
const logger = require('../../utils/logger');
const { query } = require('../../db/connection');

class RiskLimitsService {
  constructor() {
    this.riskConfig = {
      daily_loss_limit_usd: parseFloat(process.env.DAILY_LOSS_LIMIT_USD || 10000),
      position_size_limit_usd: parseFloat(process.env.POSITION_SIZE_LIMIT_USD || 50000),
      max_trades_per_hour: parseInt(process.env.MAX_TRADES_PER_HOUR || 100),
      max_trades_per_day: 500,
      cooldown_period_ms: parseInt(process.env.COOLDOWN_PERIOD_MS || 60000),
      correlation_threshold: 0.8 // Risk score multiplier
    };
    this.walletRiskCache = new Map();
  }

  // Initialize risk service
  async initialize() {
    logger.info('Risk Limits Service initialized with config:', this.riskConfig);
  }

  // Check if trade violates daily loss limit
  async checkDailyLossLimit(walletId) {
    try {
      const today = new Date().toISOString().split('T')[0];

      const result = await query(`
        SELECT 
          SUM(CASE WHEN pnl_usd < 0 THEN pnl_usd ELSE 0 END) as total_losses
        FROM trades
        WHERE wallet_id = $1 
        AND DATE(executed_at) = $2
        AND status IN ('completed', 'failed')
      `, [walletId, today]);

      const totalLosses = Math.abs(parseFloat(result.rows[0]?.total_losses || 0));

      if (totalLosses >= this.riskConfig.daily_loss_limit_usd) {
        logger.warn(`Daily loss limit exceeded for wallet ${walletId}: $${totalLosses}`);
        return {
          allowed: false,
          violation_type: 'daily_loss_limit',
          current_loss: totalLosses,
          limit: this.riskConfig.daily_loss_limit_usd,
          message: `Daily loss limit reached: $${totalLosses}/$${this.riskConfig.daily_loss_limit_usd}`
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Failed to check daily loss limit:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Check if position size exceeds limit
  async checkPositionSizeLimit(walletId, trade) {
    try {
      const tradeSize = parseFloat(trade.size_usd || 0);

      if (tradeSize > this.riskConfig.position_size_limit_usd) {
        logger.warn(`Position size limit exceeded for wallet ${walletId}: $${tradeSize}`);
        return {
          allowed: false,
          violation_type: 'position_size',
          position_size: tradeSize,
          limit: this.riskConfig.position_size_limit_usd,
          message: `Position size too large: $${tradeSize}/$${this.riskConfig.position_size_limit_usd}`
        };
      }

      // Check current exposure
      const exposure = await this.getWalletExposure(walletId);
      const newExposure = exposure + tradeSize;

      if (newExposure > this.riskConfig.position_size_limit_usd * 2) {
        logger.warn(`Portfolio exposure limit exceeded for wallet ${walletId}: $${newExposure}`);
        return {
          allowed: false,
          violation_type: 'exposure_limit',
          current_exposure: exposure,
          new_exposure: newExposure,
          message: `Portfolio exposure too high: $${newExposure}`
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Failed to check position size limit:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Get current wallet exposure
  async getWalletExposure(walletId) {
    try {
      const result = await query(`
        SELECT SUM(size_usd) as exposure
        FROM trades
        WHERE wallet_id = $1 
        AND status = 'executing'
      `, [walletId]);

      return parseFloat(result.rows[0]?.exposure || 0);
    } catch (error) {
      logger.error('Failed to get wallet exposure:', error);
      return 0;
    }
  }

  // Check trade frequency limits
  async checkTradeFrequencyLimit(walletId) {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const result = await query(`
        SELECT COUNT(*) as trade_count
        FROM trades
        WHERE wallet_id = $1 
        AND executed_at > $2
        AND status IN ('completed', 'executing')
      `, [walletId, oneHourAgo]);

      const tradeCount = parseInt(result.rows[0]?.trade_count || 0);

      if (tradeCount >= this.riskConfig.max_trades_per_hour) {
        logger.warn(`Trade frequency limit exceeded for wallet ${walletId}: ${tradeCount} trades/hour`);
        return {
          allowed: false,
          violation_type: 'trade_frequency',
          current_trades: tradeCount,
          limit: this.riskConfig.max_trades_per_hour,
          message: `Max trades per hour exceeded: ${tradeCount}/${this.riskConfig.max_trades_per_hour}`
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Failed to check trade frequency limit:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Check cooldown period after failed trade
  async checkCooldownPeriod(walletId) {
    try {
      const cooldownWindow = new Date(Date.now() - this.riskConfig.cooldown_period_ms);

      const result = await query(`
        SELECT created_at
        FROM trades
        WHERE wallet_id = $1 
        AND status = 'failed'
        AND executed_at > $2
        ORDER BY executed_at DESC
        LIMIT 1
      `, [walletId, cooldownWindow]);

      if (result.rows.length > 0) {
        const lastFailure = new Date(result.rows[0].created_at);
        const cooldownRemaining = this.riskConfig.cooldown_period_ms - (Date.now() - lastFailure.getTime());

        if (cooldownRemaining > 0) {
          logger.warn(`Cooldown period active for wallet ${walletId}: ${cooldownRemaining}ms remaining`);
          return {
            allowed: false,
            violation_type: 'cooldown_violation',
            cooldown_remaining_ms: cooldownRemaining,
            message: `Cooldown period active: ${Math.ceil(cooldownRemaining / 1000)}s remaining`
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Failed to check cooldown period:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Comprehensive risk check
  async checkRisk(walletId, trade) {
    const checks = await Promise.all([
      this.checkDailyLossLimit(walletId),
      this.checkPositionSizeLimit(walletId, trade),
      this.checkTradeFrequencyLimit(walletId),
      this.checkCooldownPeriod(walletId)
    ]);

    for (const check of checks) {
      if (!check.allowed) {
        return check;
      }
    }

    return { allowed: true, message: 'All risk checks passed' };
  }

  // Record risk violation
  async recordRiskViolation(walletId, violation) {
    try {
      await query(`
        INSERT INTO risk_violations 
        (wallet_id, violation_type, details, severity)
        VALUES ($1, $2, $3, $4)
      `, [
        walletId,
        violation.violation_type,
        JSON.stringify(violation),
        'high'
      ]);

      logger.warn(`Risk violation recorded for wallet ${walletId}:`, violation);
    } catch (error) {
      logger.error('Failed to record risk violation:', error);
    }
  }

  // Calculate portfolio correlation risk
  async calculateCorrelationRisk(walletId) {
    try {
      const result = await query(`
        SELECT 
          correlation,
          COUNT(*) as position_count
        FROM portfolio_correlations
        WHERE wallet_id = $1
        AND correlation > $2
        GROUP BY correlation
      `, [walletId, this.riskConfig.correlation_threshold]);

      const riskScore = result.rows.reduce((sum, row) => {
        return sum + (row.correlation * row.position_count);
      }, 0);

      return {
        correlation_risk_score: Math.min(riskScore, 100),
        high_correlation_positions: result.rows.length,
        recommendation: riskScore > 50 ? 'Reduce correlated positions' : 'Risk acceptable'
      };
    } catch (error) {
      logger.error('Failed to calculate correlation risk:', error);
      return { error: error.message };
    }
  }

  // Get wallet risk profile
  async getWalletRiskProfile(walletId) {
    try {
      const dailyLoss = await this.checkDailyLossLimit(walletId);
      const exposure = await this.getWalletExposure(walletId);
      const correlation = await this.calculateCorrelationRisk(walletId);

      return {
        wallet_id: walletId,
        daily_loss: {
          current: dailyLoss.current_loss || 0,
          limit: dailyLoss.limit,
          percentage: dailyLoss.current_loss ? (dailyLoss.current_loss / dailyLoss.limit * 100) : 0
        },
        exposure: {
          current: exposure,
          limit: this.riskConfig.position_size_limit_usd * 2
        },
        correlation_risk: correlation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get wallet risk profile:', error);
      return { error: error.message };
    }
  }

  // Update risk configuration
  updateRiskConfig(newConfig) {
    this.riskConfig = { ...this.riskConfig, ...newConfig };
    logger.info('Risk configuration updated:', this.riskConfig);
  }

  // Get current risk configuration
  getRiskConfig() {
    return { ...this.riskConfig };
  }
}

module.exports = new RiskLimitsService();
