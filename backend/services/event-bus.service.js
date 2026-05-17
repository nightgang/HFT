const redis = require('redis');
const logger = require('../utils/logger');

class EventBusService {
  constructor() {
    this.pub = null;
    this.sub = null;
    this.subscriptions = new Map(); // channel -> handler
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      const redisUrl = process.env.REDIS_URL || (() => {
        const host = process.env.REDIS_HOST || 'localhost';
        const port = process.env.REDIS_PORT || 6379;
        const db = process.env.REDIS_DB || 0;
        const password = process.env.REDIS_PASSWORD;
        return password
          ? `redis://:${password}@${host}:${port}/${db}`
          : `redis://${host}:${port}/${db}`;
      })();

      this.pub = redis.createClient({ url: redisUrl });
      this.sub = redis.createClient({ url: redisUrl });

      this.pub.on('error', (err) => logger.error('EventBus pub error:', err));
      this.sub.on('error', (err) => logger.error('EventBus sub error:', err));

      await this.pub.connect();
      await this.sub.connect();

      logger.info('EventBus connected to Redis');
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize EventBus:', error);
      throw error;
    }
  }

  async publish(channel, message) {
    try {
      if (!this.pub) throw new Error('EventBus not initialized');
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      await this.pub.publish(channel, payload);
      logger.debug(`EventBus published to ${channel}`);
    } catch (error) {
      logger.error('EventBus publish error:', error);
      throw error;
    }
  }

  async publishEvent(channel, message, fallbackData = null) {
    try {
      await this.publish(channel, message);
    } catch (error) {
      logger.warn(`EventBus publishEvent failed for ${channel}: ${error.message}`);
      if (fallbackData) {
        try {
          const websocketServer = require('../ws/websocket.server');
          websocketServer.broadcast(fallbackData);
        } catch (fallbackError) {
          logger.error('Fallback WebSocket broadcast failed:', fallbackError);
        }
      }
    }
  }

  async subscribe(channel, handler) {
    if (!this.sub) throw new Error('EventBus not initialized');

    const wrapped = async (message) => {
      try {
        let parsed = message;
        try { parsed = JSON.parse(message); } catch (e) { /* keep raw */ }
        await handler(parsed);
      } catch (error) {
        logger.error(`EventBus handler error for ${channel}:`, error);
      }
    };

    this.subscriptions.set(channel, wrapped);
    await this.sub.subscribe(channel, wrapped);
    logger.info(`EventBus subscribed to ${channel}`);
    return () => {
      // Unsubscribe helper
      if (this.subscriptions.has(channel)) {
        this.subscriptions.delete(channel);
        try { this.sub.unsubscribe(channel); } catch (e) { /* ignore */ }
      }
    };
  }

  async close() {
    try {
      if (this.sub) await this.sub.quit();
      if (this.pub) await this.pub.quit();
      this.isInitialized = false;
      logger.info('EventBus connections closed');
    } catch (error) {
      logger.error('Error closing EventBus:', error);
    }
  }
}

module.exports = new EventBusService();
