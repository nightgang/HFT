jest.mock('../services/correlation.service', () => ({
  analyzeTokenCorrelation: jest.fn()
}));

const portfolioTrackerService = require('../services/portfolio-tracker.service');
const correlationService = require('../services/correlation.service');
const { query } = require('../db/connection');

describe('PortfolioTrackerService', () => {
  beforeEach(() => {
    query.mockClear();
    correlationService.analyzeTokenCorrelation.mockClear();
  });

  test('should compute portfolio correlation analysis for holdings with at least two tokens', async () => {
    const mockHoldings = [
      {
        token_mint: 'TOKEN_A',
        token_symbol: 'A',
        balance: 10,
        recorded_at: new Date(),
        current_price_usd: 5,
        market_cap_usd: 1000000
      },
      {
        token_mint: 'TOKEN_B',
        token_symbol: 'B',
        balance: 4,
        recorded_at: new Date(),
        current_price_usd: 20,
        market_cap_usd: 500000
      }
    ];

    query.mockResolvedValueOnce({ rows: mockHoldings });
    correlationService.analyzeTokenCorrelation.mockResolvedValueOnce({
      tokenA: 'TOKEN_A',
      tokenB: 'TOKEN_B',
      correlation: 0.65,
      confidence: 72,
      dataPoints: 24,
      timeWindow: 86400000,
      analysis: 'Strong positive correlation',
      timestamp: Date.now()
    });

    const result = await portfolioTrackerService.getCorrelationAnalysis('wallet-id-1');

    expect(result).toHaveProperty('walletId', 'wallet-id-1');
    expect(result).toHaveProperty('analyzedPairs', 1);
    expect(result.correlations).toHaveLength(1);
    expect(result.correlations[0]).toMatchObject({
      tokenA: 'TOKEN_A',
      tokenB: 'TOKEN_B',
      correlation: 0.65,
      interpretation: 'Strong positive correlation'
    });
    expect(correlationService.analyzeTokenCorrelation).toHaveBeenCalledWith('TOKEN_A', 'TOKEN_B');
    expect(query).toHaveBeenCalledWith('DELETE FROM portfolio_correlations WHERE wallet_id = $1', ['wallet-id-1']);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO portfolio_correlations'),
      ['wallet-id-1', 'TOKEN_A', 'TOKEN_B', 0.65]
    );
  });

  test('should return note when portfolio has fewer than two holdings', async () => {
    const mockHoldings = [
      {
        token_mint: 'TOKEN_A',
        token_symbol: 'A',
        balance: 10,
        recorded_at: new Date(),
        current_price_usd: 5,
        market_cap_usd: 1000000
      }
    ];

    query.mockResolvedValueOnce({ rows: mockHoldings });

    const result = await portfolioTrackerService.getCorrelationAnalysis('wallet-id-2');

    expect(result).toHaveProperty('analyzedPairs', 0);
    expect(result.correlations).toEqual([]);
    expect(result.note).toContain('Not enough portfolio holdings');
  });
});
