jest.mock('../services/event-bus.service', () => ({
  initialize: jest.fn(),
  subscribe: jest.fn(),
}));

jest.mock('../ws/websocket.server', () => ({
  broadcast: jest.fn(),
}));

const eventBus = require('../services/event-bus.service');
const websocketServer = require('../ws/websocket.server');
const realtimeService = require('../services/realtime.service');

describe('RealtimeService', () => {
  let channelHandlers;
  let unsubscribeMocks;

  beforeEach(() => {
    jest.clearAllMocks();
    channelHandlers = {};
    unsubscribeMocks = [];

    eventBus.initialize.mockResolvedValue();
    eventBus.subscribe.mockImplementation(async (channel, handler) => {
      channelHandlers[channel] = handler;
      const unsubMock = jest.fn();
      unsubscribeMocks.push(unsubMock);
      return unsubMock;
    });
  });

  it('should initialize and subscribe to all configured EventBus channels', async () => {
    await realtimeService.initialize();

    expect(eventBus.initialize).toHaveBeenCalled();
    expect(eventBus.subscribe).toHaveBeenCalledWith('token.detected', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('ai.prediction', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('trade.executed', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('trade.failed', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('trade.retry', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('risk.alert', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('katana.status', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('price.update', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('pnl.update', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('arbitrage.signal', expect.any(Function));
    expect(eventBus.subscribe).toHaveBeenCalledWith('smartmoney.signal', expect.any(Function));
  });

  it('should forward token.detected payloads to websocket broadcast', async () => {
    await realtimeService.initialize();

    const payload = { type: 'TOKEN_DETECTED', data: { mint: 'So11111111111111111111111111111111111111112' } };
    await channelHandlers['token.detected'](payload);

    expect(websocketServer.broadcast).toHaveBeenCalledWith(payload);
  });

  it('should normalize ai.prediction payloads before broadcasting', async () => {
    await realtimeService.initialize();

    const payload = { tokenMint: 'Token123', recommendation: 'BUY' };
    await channelHandlers['ai.prediction'](payload);

    expect(websocketServer.broadcast).toHaveBeenCalledWith({
      type: 'ai-prediction',
      tokenMint: 'Token123',
      recommendation: 'BUY'
    });
  });

  it('should unsubscribe from all channels during shutdown', async () => {
    await realtimeService.initialize();

    await realtimeService.shutdown();

    unsubscribeMocks.forEach((unsubMock) => {
      expect(unsubMock).toHaveBeenCalled();
    });
  });
});
