const { WebSocketServer } = require('../ws/websocket.server');

describe('WebSocketServer normalizeMessage()', () => {
  let server;

  beforeEach(() => {
    server = new WebSocketServer();
  });

  it('normalizes TRADE_RETRY to trade-retry with trades array and reason', () => {
    const payload = {
      type: 'TRADE_RETRY',
      data: {
        trade: { id: 'trade-1', tokenMint: 'SOL', status: 'retrying' },
        reason: 'rate limit'
      }
    };

    const normalized = server.normalizeMessage(payload);

    expect(normalized.type).toBe('trade-retry');
    expect(normalized.trades).toEqual([{ id: 'trade-1', tokenMint: 'SOL', status: 'retrying' }]);
    expect(normalized.reason).toBe('rate limit');
    expect(normalized.data).toBeUndefined();
  });

  it('normalizes PRICE_UPDATE to price-update with price payload', () => {
    const payload = {
      type: 'PRICE_UPDATE',
      data: { tokenMint: 'SOL', price: 34.12 }
    };

    const normalized = server.normalizeMessage(payload);

    expect(normalized.type).toBe('price-update');
    expect(normalized.price).toEqual({ tokenMint: 'SOL', price: 34.12 });
    expect(normalized.data).toBeUndefined();
  });

  it('normalizes ARBITRAGE_SIGNAL to arbitrage-signal with signal payload', () => {
    const payload = {
      type: 'ARBITRAGE_SIGNAL',
      data: { tokenMint: 'SOL', spread: 0.012, route: 'A->B' }
    };

    const normalized = server.normalizeMessage(payload);

    expect(normalized.type).toBe('arbitrage-signal');
    expect(normalized.signal).toEqual({ tokenMint: 'SOL', spread: 0.012, route: 'A->B' });
    expect(normalized.data).toBeUndefined();
  });

  it('normalizes SMART_MONEY_SIGNAL to smartmoney-signal with signal payload', () => {
    const payload = {
      type: 'SMART_MONEY_SIGNAL',
      data: { walletAddress: 'Wallet123', score: 96 }
    };

    const normalized = server.normalizeMessage(payload);

    expect(normalized.type).toBe('smartmoney-signal');
    expect(normalized.signal).toEqual({ walletAddress: 'Wallet123', score: 96 });
    expect(normalized.data).toBeUndefined();
  });

  it('normalizes AI_PREDICTION to ai-prediction with prediction payload', () => {
    const payload = {
      type: 'AI_PREDICTION',
      data: { tokenMint: 'SOL', score: 0.74, recommendation: 'buy' }
    };

    const normalized = server.normalizeMessage(payload);

    expect(normalized.type).toBe('ai-prediction');
    expect(normalized.prediction).toEqual({ tokenMint: 'SOL', score: 0.74, recommendation: 'buy' });
    expect(normalized.data).toBeUndefined();
  });
});
