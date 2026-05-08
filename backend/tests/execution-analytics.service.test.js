jest.mock('../services/cache.service');
jest.mock('../utils/logger');

const executionAnalyticsService = require('../services/execution-analytics.service');
const cacheService = require('../services/cache.service');

describe('ExecutionAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue();
  });

  it('should generate analytics with ROI and heatmap', async () => {
    const result = await executionAnalyticsService.generateExecutionAnalytics('demo-wallet', 7);

    expect(result).toBeDefined();
    expect(result.successRate).toBeGreaterThanOrEqual(0);
    expect(result.roiPercent).toBeDefined();
    expect(result.tradeHeatmap).toBeDefined();
    expect(Array.isArray(result.tradeHeatmap.rows)).toBe(true);
    expect(result.tradeHeatmap.rows).toHaveLength(7);
    expect(result.tradeHeatmap.maxCount).toBeGreaterThanOrEqual(0);
    expect(result.totalTrades).toBeGreaterThanOrEqual(0);
  });

  it('should return cached analytics if present', async () => {
    const cachedAnalytics = { walletId: 'demo-wallet', totalTrades: 10, successRate: 80, roiPercent: 5, tradeHeatmap: { rows: [], maxCount: 0 } };
    cacheService.get.mockResolvedValue(cachedAnalytics);

    const result = await executionAnalyticsService.generateExecutionAnalytics('demo-wallet', 7);
    expect(result).toEqual(cachedAnalytics);
    expect(cacheService.set).not.toHaveBeenCalled();
  });
});