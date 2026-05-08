const { RiskManagementService } = require('../services/risk/risk.service');
const { query } = require('../db/connection');
const logger = require('../utils/logger');
const metricsService = require('../services/monitoring/metrics.service');

jest.mock('../utils/logger');
jest.mock('../services/monitoring/metrics.service');

describe('RiskManagementService', () => {
  let riskService;

  beforeEach(() => {
    jest.clearAllMocks();
    riskService = new RiskManagementService();
  });

  describe('canExecuteTrade', () => {
    const mockWalletId = 'test-wallet-123';
    const mockTradeParams = {
      amountIn: 100,
      tokenIn: { mint: 'SOL123' },
      tokenOut: { mint: 'USDC456' }
    };

    it('should allow trade when all checks pass', async () => {
      // Mock all checks to pass
      riskService.checkDailyLossLimit = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkPositionSizeLimit = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkTradeFrequencyLimit = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkCooldownPeriod = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkPortfolioExposure = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkTradeInterval = jest.fn().mockResolvedValue({ allowed: true });

      const result = await riskService.canExecuteTrade(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(true);
      expect(result.violations).toBeUndefined();
    });

    it('should deny trade when any check fails', async () => {
      const violation = {
        allowed: false,
        type: 'daily_loss_limit',
        message: 'Daily loss limit exceeded',
        details: { dailyPnl: -100 }
      };

      riskService.checkDailyLossLimit = jest.fn().mockResolvedValue(violation);
      riskService.checkPositionSizeLimit = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkTradeFrequencyLimit = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkCooldownPeriod = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkPortfolioExposure = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkTradeInterval = jest.fn().mockResolvedValue({ allowed: true });
      riskService.logRiskViolation = jest.fn().mockResolvedValue();

      const result = await riskService.canExecuteTrade(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].type).toBe('daily_loss_limit');
      expect(riskService.logRiskViolation).toHaveBeenCalledWith(
        mockWalletId,
        'daily_loss_limit',
        violation.details
      );
      expect(metricsService.recordRiskViolation).toHaveBeenCalledWith('daily_loss_limit', 'medium');
    });

    it('should handle multiple violations', async () => {
      const violation1 = {
        allowed: false,
        type: 'daily_loss_limit',
        message: 'Daily loss limit exceeded',
        details: { dailyPnl: -100 }
      };
      const violation2 = {
        allowed: false,
        type: 'position_size_limit',
        message: 'Position size exceeded',
        details: { usdValue: 2000 }
      };

      riskService.checkDailyLossLimit = jest.fn().mockResolvedValue(violation1);
      riskService.checkPositionSizeLimit = jest.fn().mockResolvedValue(violation2);
      riskService.checkTradeFrequencyLimit = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkCooldownPeriod = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkPortfolioExposure = jest.fn().mockResolvedValue({ allowed: true });
      riskService.checkTradeInterval = jest.fn().mockResolvedValue({ allowed: true });
      riskService.logRiskViolation = jest.fn().mockResolvedValue();

      const result = await riskService.canExecuteTrade(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(metricsService.recordRiskViolation).toHaveBeenCalledTimes(2);
    });

    it('should handle system errors gracefully', async () => {
      riskService.checkDailyLossLimit = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await riskService.canExecuteTrade(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Database error');
      expect(logger.error).toHaveBeenCalledWith('Risk check failed:', expect.any(Error));
    });
  });

  describe('checkDailyLossLimit', () => {
    const mockWalletId = 'test-wallet-123';

    it('should allow trade when daily loss is within limits', async () => {
      query.mockResolvedValue({
        rows: [{ daily_pnl: -10, trade_count: 5 }]
      });

      const result = await riskService.checkDailyLossLimit(mockWalletId);

      expect(result.allowed).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [mockWalletId, expect.any(Date)]
      );
    });

    it('should deny trade when daily loss limit is exceeded', async () => {
      query.mockResolvedValue({
        rows: [{ daily_pnl: -60, trade_count: 10 }]
      });

      const result = await riskService.checkDailyLossLimit(mockWalletId);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('daily_loss_limit');
      expect(result.message).toContain('Daily loss limit exceeded');
      expect(result.details.dailyPnl).toBe(-60);
    });

    it('should handle database errors', async () => {
      query.mockRejectedValue(new Error('Database connection failed'));

      const result = await riskService.checkDailyLossLimit(mockWalletId);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('system_error');
      expect(logger.error).toHaveBeenCalledWith('Daily loss limit check failed:', expect.any(Error));
    });
  });

  describe('checkPositionSizeLimit', () => {
    const mockWalletId = 'test-wallet-123';
    const mockTradeParams = {
      amountIn: 100,
      tokenIn: { mint: 'SOL123' }
    };

    it('should allow trade when position size is within limits', async () => {
      query.mockResolvedValueOnce({
        rows: [{ current_balance: 50 }]
      });

      const result = await riskService.checkPositionSizeLimit(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(true);
    });

    it('should deny trade when position size exceeds limit', async () => {
      query.mockResolvedValueOnce({
        rows: [{ current_balance: 100000000 }]
      });

      const result = await riskService.checkPositionSizeLimit(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('position_size_limit');
      expect(result.message).toContain('Position size limit exceeded');
    });

    it('should handle zero current balance', async () => {
      query.mockResolvedValueOnce({
        rows: [{}] // No current_balance
      });

      const result = await riskService.checkPositionSizeLimit(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(true);
    });
  });

  describe('checkTradeFrequencyLimit', () => {
    const mockWalletId = 'test-wallet-123';

    it('should allow trade when frequency is within limits', async () => {
      query.mockResolvedValue({
        rows: [{ trades_last_hour: 50, trades_last_day: 200 }]
      });

      const result = await riskService.checkTradeFrequencyLimit(mockWalletId);

      expect(result.allowed).toBe(true);
    });

    it('should deny trade when hourly limit is exceeded', async () => {
      query.mockResolvedValue({
        rows: [{ trades_last_hour: 120, trades_last_day: 200 }]
      });

      const result = await riskService.checkTradeFrequencyLimit(mockWalletId);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('trade_frequency_limit');
      expect(result.message).toContain('Hourly trade limit exceeded');
    });

    it('should deny trade when daily limit is exceeded', async () => {
      query.mockResolvedValue({
        rows: [{ trades_last_hour: 50, trades_last_day: 600 }]
      });

      const result = await riskService.checkTradeFrequencyLimit(mockWalletId);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('trade_frequency_limit');
      expect(result.message).toContain('Daily trade limit exceeded');
    });
  });

  describe('checkCooldownPeriod', () => {
    const mockWalletId = 'test-wallet-123';

    it('should allow trade when no recent failed trades', async () => {
      query.mockResolvedValue({
        rows: [{ created_at: new Date(), status: 'completed' }]
      });

      const result = await riskService.checkCooldownPeriod(mockWalletId);

      expect(result.allowed).toBe(true);
    });

    it('should allow trade when last trade was successful', async () => {
      query.mockResolvedValue({
        rows: [{ created_at: new Date(), status: 'completed' }]
      });

      const result = await riskService.checkCooldownPeriod(mockWalletId);

      expect(result.allowed).toBe(true);
    });

    it('should deny trade during cooldown period', async () => {
      const recentFailure = new Date(Date.now() - 10000); // 10 seconds ago
      query.mockResolvedValue({
        rows: [{ created_at: recentFailure, status: 'failed' }]
      });

      const result = await riskService.checkCooldownPeriod(mockWalletId);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('cooldown_period');
      expect(result.message).toContain('Cooldown period active');
    });

    it('should allow trade after cooldown period expires', async () => {
      const oldFailure = new Date(Date.now() - 60000); // 1 minute ago
      query.mockResolvedValue({
        rows: [{ created_at: oldFailure, status: 'failed' }]
      });

      const result = await riskService.checkCooldownPeriod(mockWalletId);

      expect(result.allowed).toBe(true);
    });

    it('should allow trade when no previous trades exist', async () => {
      query.mockResolvedValue({
        rows: []
      });

      const result = await riskService.checkCooldownPeriod(mockWalletId);

      expect(result.allowed).toBe(true);
    });
  });

  describe('checkPortfolioExposure', () => {
    const mockWalletId = 'test-wallet-123';
    const mockTradeParams = {
      amountIn: 100,
      tokenIn: { mint: 'SOL123' }
    };

    it('should allow trade when exposure is within limits', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ portfolio_value_usd: 10000 }] })
        .mockResolvedValueOnce({ rows: [{ token_exposure_usd: 500 }] });

      const result = await riskService.checkPortfolioExposure(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(true);
    });

    it('should deny trade when exposure exceeds limit', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ portfolio_value_usd: 100 }] })
        .mockResolvedValueOnce({ rows: [{ token_exposure_usd: 95 }] });

      const result = await riskService.checkPortfolioExposure(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('portfolio_exposure_limit');
      expect(result.message).toContain('Portfolio exposure limit exceeded');
    });

    it('should handle zero portfolio value', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ portfolio_value_usd: 0 }] })
        .mockResolvedValueOnce({ rows: [{ token_exposure_usd: 0 }] });

      const result = await riskService.checkPortfolioExposure(mockWalletId, mockTradeParams);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('portfolio_exposure_limit');
    });
  });

  describe('checkTradeInterval', () => {
    const mockWalletId = 'test-wallet-123';

    it('should allow trade when minimum interval is met', async () => {
      const oldTrade = new Date(Date.now() - 2000); // 2 seconds ago
      query.mockResolvedValue({
        rows: [{ created_at: oldTrade }]
      });

      const result = await riskService.checkTradeInterval(mockWalletId);

      expect(result.allowed).toBe(true);
    });

    it('should deny trade when minimum interval is not met', async () => {
      const recentTrade = new Date(Date.now() - 500); // 0.5 seconds ago
      query.mockResolvedValue({
        rows: [{ created_at: recentTrade }]
      });

      const result = await riskService.checkTradeInterval(mockWalletId);

      expect(result.allowed).toBe(false);
      expect(result.type).toBe('trade_interval_limit');
      expect(result.message).toContain('Minimum trade interval not met');
    });

    it('should allow trade when no previous trades exist', async () => {
      query.mockResolvedValue({
        rows: []
      });

      const result = await riskService.checkTradeInterval(mockWalletId);

      expect(result.allowed).toBe(true);
    });
  });

  describe('logRiskViolation', () => {
    const mockWalletId = 'test-wallet-123';
    const mockViolationType = 'daily_loss_limit';
    const mockDetails = { limit: -0.05, actual: -0.08 };

    it('should log violation successfully', async () => {
      query.mockResolvedValue();

      await riskService.logRiskViolation(mockWalletId, mockViolationType, mockDetails);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO risk_violations'),
        [
          mockWalletId,
          mockViolationType,
          'medium',
          mockDetails.limit,
          mockDetails.actual,
          JSON.stringify(mockDetails)
        ]
      );
      expect(logger.warn).toHaveBeenCalledWith(
        `Risk violation logged: ${mockViolationType} for wallet ${mockWalletId}`,
        mockDetails
      );
    });

    it('should handle logging errors gracefully', async () => {
      query.mockRejectedValue(new Error('Database error'));

      await expect(riskService.logRiskViolation(mockWalletId, mockViolationType, mockDetails))
        .resolves.not.toThrow();

      expect(logger.error).toHaveBeenCalledWith('Failed to log risk violation:', expect.any(Error));
    });
  });

  describe('calculateRiskScore', () => {
    const mockWalletId = 'test-wallet-123';

    it('should calculate risk score correctly', async () => {
      query
        .mockResolvedValueOnce({
          rows: [{
            total_trades: 100,
            failed_trades: 10,
            losing_trades: 30,
            total_pnl: -500,
            avg_pnl: -5
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ violation_count: 5 }]
        });

      const result = await riskService.calculateRiskScore(mockWalletId);

      expect(result.walletId).toBe(mockWalletId);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
      expect(result.components).toHaveProperty('failureRate');
      expect(result.components).toHaveProperty('lossRate');
      expect(result.components).toHaveProperty('violationCount');
    });

    it('should handle zero trades', async () => {
      query
        .mockResolvedValueOnce({
          rows: [{
            total_trades: 0,
            failed_trades: 0,
            losing_trades: 0,
            total_pnl: 0,
            avg_pnl: 0
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ violation_count: 0 }]
        });

      const result = await riskService.calculateRiskScore(mockWalletId);

      expect(result.riskScore).toBe(0);
    });

    it('should cap risk score at 100', async () => {
      query
        .mockResolvedValueOnce({
          rows: [{
            total_trades: 100,
            failed_trades: 100,
            losing_trades: 100,
            total_pnl: -10000,
            avg_pnl: -1000
          }]
        })
        .mockResolvedValueOnce({
          rows: [{ violation_count: 100 }]
        });

      const result = await riskService.calculateRiskScore(mockWalletId);

      expect(result.riskScore).toBe(100);
    });
  });
});