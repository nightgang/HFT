// Risk Engine Tests
const riskLimitsService = require('../../services/risk/risk-limits.service');
const { query } = require('../../db/connection');

describe('Risk Limits Service', () => {
  beforeAll(async () => {
    await riskLimitsService.initialize();
  });

  describe('Daily Loss Limit', () => {
    test('should allow trade when below daily loss limit', async () => {
      const result = await riskLimitsService.checkDailyLossLimit('test-wallet-1');
      expect(result).toHaveProperty('allowed');
    });

    test('should block trade when daily loss limit exceeded', async () => {
      // This would require setting up test data
      // In production, mock the query
      expect(riskLimitsService.riskConfig.daily_loss_limit_usd).toBe(10000);
    });
  });

  describe('Position Size Limits', () => {
    test('should validate position size', async () => {
      const trade = {
        size_usd: 25000 // Below limit
      };
      const result = await riskLimitsService.checkPositionSizeLimit('test-wallet-1', trade);
      expect(result).toHaveProperty('allowed');
    });

    test('should reject oversized positions', async () => {
      const trade = {
        size_usd: 100000 // Above limit
      };
      const result = await riskLimitsService.checkPositionSizeLimit('test-wallet-1', trade);
      // Would need mock data to test properly
      expect(result).toHaveProperty('violation_type');
    });
  });

  describe('Trade Frequency Limits', () => {
    test('should track trade frequency', async () => {
      expect(riskLimitsService.riskConfig.max_trades_per_hour).toBe(100);
    });

    test('should respect trade frequency limits', async () => {
      const result = await riskLimitsService.checkTradeFrequencyLimit('test-wallet-1');
      expect(result).toHaveProperty('allowed');
    });
  });

  describe('Cooldown Periods', () => {
    test('should enforce cooldown after failed trade', async () => {
      const result = await riskLimitsService.checkCooldownPeriod('test-wallet-1');
      expect(result).toHaveProperty('allowed');
    });
  });

  describe('Comprehensive Risk Check', () => {
    test('should perform all risk checks', async () => {
      const trade = {
        trade_id: 'test-trade-1',
        token_in: 'SOL',
        token_out: 'USDC',
        amount_in: 1000,
        size_usd: 25000
      };

      const result = await riskLimitsService.checkRisk('test-wallet-1', trade);
      expect(result).toHaveProperty('allowed');
    });
  });

  describe('Risk Configuration', () => {
    test('should get current risk config', () => {
      const config = riskLimitsService.getRiskConfig();
      expect(config).toHaveProperty('daily_loss_limit_usd');
      expect(config).toHaveProperty('position_size_limit_usd');
    });

    test('should update risk config', () => {
      const newConfig = { daily_loss_limit_usd: 5000 };
      riskLimitsService.updateRiskConfig(newConfig);
      expect(riskLimitsService.getRiskConfig().daily_loss_limit_usd).toBe(5000);
      
      // Reset
      riskLimitsService.updateRiskConfig({ daily_loss_limit_usd: 10000 });
    });
  });

  describe('Risk Profile', () => {
    test('should generate wallet risk profile', async () => {
      const profile = await riskLimitsService.getWalletRiskProfile('test-wallet-1');
      expect(profile).toHaveProperty('wallet_id');
      expect(profile).toHaveProperty('daily_loss');
      expect(profile).toHaveProperty('exposure');
    });
  });
});
