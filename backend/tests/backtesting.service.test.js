/// <reference types="jest" />

jest.mock('../integrations/jupiter.service');
jest.mock('../services/cache.service');

const backtestingService = require('../services/backtesting.service');
const jupiterService = /** @type {jest.Mocked<typeof import('../integrations/jupiter.service')>} */ (require('../integrations/jupiter.service'));
const cacheService = /** @type {{ get: jest.Mock; set: jest.Mock }} */ ((/** @type {unknown} */ require('../services/cache.service')));

describe('BacktestingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue();
    jupiterService.getTokenPrice.mockResolvedValue({ price: 10, vsToken: 'USDC', lastUpdated: Date.now() });
  });

  it('should run buy and hold backtest successfully', async () => {
    const result = await backtestingService.runBacktest({
      tokenMint: 'So11111111111111111111111111111111111111112',
      strategy: 'buy_and_hold',
      startCapital: 10000,
      startDate: '2025-01-01',
      endDate: '2025-01-10',
      feeBps: 10
    });

    expect(result.success).toBe(true);
    expect(result.priceSeries).toHaveLength(10);
    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.analytics.finalCapital).toBeGreaterThan(0);
    expect(result.analytics.totalTrades).toBeGreaterThanOrEqual(1);
    expect(result.analytics.winRate).toBeGreaterThanOrEqual(0);
  });

  it('should support strategy list retrieval', () => {
    const strategies = backtestingService.getSupportedStrategies();
    expect(strategies).toContain('buy_and_hold');
    expect(strategies).toContain('moving_average_crossover');
    expect(strategies).toContain('dollar_cost_average');
  });

  it('should return cached backtest result if available', async () => {
    const cachedPayload = { success: true, tokenMint: 'ABC', strategy: 'buy_and_hold' };
    cacheService.get.mockResolvedValue(cachedPayload);

    const result = await backtestingService.runBacktest({ tokenMint: 'ABC' });
    expect(result).toEqual(cachedPayload);
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('should return an error for unsupported strategy', async () => {
    const result = await backtestingService.runBacktest({ tokenMint: 'ABC', strategy: 'unknown_strategy' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Unsupported strategy/);
  });

  it('should run walk-forward validation successfully', async () => {
    const result = await backtestingService.runWalkForwardValidation({
      tokenMint: 'So11111111111111111111111111111111111111112',
      strategy: 'buy_and_hold',
      startCapital: 10000,
      startDate: '2025-01-01',
      endDate: '2025-04-15',
      windowSizeDays: 30,
      stepSizeDays: 15
    });

    expect(result.success).toBe(true);
    expect(result.totalWindows).toBeGreaterThan(0);
    expect(Array.isArray(result.windows)).toBe(true);
    expect(result.windows[0].training.analytics).toBeDefined();
  });

  it('should run paper backtesting with simulated trades', async () => {
    const result = await backtestingService.runPaperTrading({
      tokenMint: 'So11111111111111111111111111111111111111112',
      strategy: 'moving_average_crossover',
      startCapital: 10000,
      startDate: '2025-01-01',
      endDate: '2025-02-01'
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe('paper');
    expect(result.trades.every(t => t.simulated)).toBe(true);
  });

  it('should run shadow backtesting with simulated shadow mode', async () => {
    const result = await backtestingService.runShadowMode({
      tokenMint: 'So11111111111111111111111111111111111111112',
      strategy: 'buy_and_hold',
      startCapital: 10000,
      startDate: '2025-01-01',
      endDate: '2025-02-01'
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe('shadow');
    expect(result.trades.every(t => t.shadow === true)).toBe(true);
  });
});