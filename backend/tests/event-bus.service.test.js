jest.mock('redis', () => ({
  createClient: jest.fn()
}));

jest.mock('../ws/websocket.server', () => ({
  broadcast: jest.fn(),
}));

const redis = require('redis');
const websocketServer = require('../ws/websocket.server');
const eventBus = require('../services/event-bus.service');

describe('EventBusService', () => {
  let pubMock;
  let subMock;

  beforeEach(() => {
    jest.clearAllMocks();

    eventBus.pub = null;
    eventBus.sub = null;
    eventBus.subscriptions = new Map();
    eventBus.isInitialized = false;

    pubMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(1),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    };

    subMock = {
      connect: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    };

    redis.createClient.mockImplementation(({ url }) => {
      if (!pubMock._created) {
        pubMock._created = true;
        return pubMock;
      }
      return subMock;
    });
  });

  it('should initialize both publisher and subscriber clients with the correct Redis URL', async () => {
    process.env.REDIS_URL = '';
    process.env.REDIS_HOST = 'redis-host';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_DB = '2';
    process.env.REDIS_PASSWORD = 'password';

    await eventBus.initialize();

    expect(redis.createClient).toHaveBeenCalledTimes(2);
    expect(redis.createClient).toHaveBeenCalledWith({ url: 'redis://:password@redis-host:6380/2' });
    expect(pubMock.connect).toHaveBeenCalled();
    expect(subMock.connect).toHaveBeenCalled();
  });

  it('should publish a JSON string when message is an object', async () => {
    await eventBus.initialize();
    await eventBus.publish('test.channel', { foo: 'bar' });

    expect(pubMock.publish).toHaveBeenCalledWith('test.channel', JSON.stringify({ foo: 'bar' }));
  });

  it('should call websocket broadcast fallback when publish fails', async () => {
    await eventBus.initialize();
    pubMock.publish.mockRejectedValueOnce(new Error('publish failed'));

    const fallback = { type: 'TEST_FALLBACK', data: { value: 123 } };
    await eventBus.publishEvent('test.channel', { foo: 'bar' }, fallback);

    expect(websocketServer.broadcast).toHaveBeenCalledWith(fallback);
  });

  it('should subscribe and properly parse JSON payloads', async () => {
    await eventBus.initialize();

    const messageHandler = jest.fn();
    const unsubscribe = await eventBus.subscribe('test.channel', messageHandler);

    expect(subMock.subscribe).toHaveBeenCalledTimes(1);
    expect(subMock.subscribe).toHaveBeenCalledWith('test.channel', expect.any(Function));
    expect(typeof unsubscribe).toBe('function');

    const wrappedHandler = subMock.subscribe.mock.calls[0][1];
    await wrappedHandler(JSON.stringify({ foo: 'bar' }));

    expect(messageHandler).toHaveBeenCalledWith({ foo: 'bar' });
    await unsubscribe();
    expect(subMock.unsubscribe).toHaveBeenCalledWith('test.channel');
  });

  it('should close both Redis clients on close', async () => {
    await eventBus.initialize();
    await eventBus.close();

    expect(subMock.quit).toHaveBeenCalled();
    expect(pubMock.quit).toHaveBeenCalled();
  });
});
