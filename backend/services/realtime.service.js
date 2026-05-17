const websocketServer = require('../ws/websocket.server');

class RealtimeService {
  constructor() {
    this.eventUnsubscribers = [];
  }

  async initialize() {
    try {
      const eventBus = require('./event-bus.service');
      await eventBus.initialize();

      // Subscribe to token detected events and forward to websocket clients
      const unsub = await eventBus.subscribe('token.detected', async (payload) => {
        try {
          this.broadcast(payload);
        } catch (e) {
          console.error('Failed to forward token.detected to websocket:', e);
        }
      });

      // Subscribe to AI prediction events and forward to websocket clients
      const unsubAi = await eventBus.subscribe('ai.prediction', async (payload) => {
        try {
          // normalize payload to include a type for frontend handlers
          const message = typeof payload === 'object' ? { type: 'ai-prediction', ...payload } : { type: 'ai-prediction', data: payload };
          this.broadcast(message);
        } catch (e) {
          console.error('Failed to forward ai.prediction to websocket:', e);
        }
      });

      this.eventUnsubscribers.push(unsubAi);

      this.eventUnsubscribers.push(unsub);
      console.info('RealtimeService subscribed to event-bus channels');
    } catch (error) {
      console.error('RealtimeService initialization failed:', error);
    }
  }

  async shutdown() {
    for (const unsub of this.eventUnsubscribers) {
      try {
        await unsub();
      } catch (e) {
        // ignore
      }
    }
    this.eventUnsubscribers = [];
  }
  broadcast(data) {
    try {
      websocketServer.broadcast(data);
    } catch (error) {
      console.error('Realtime broadcast failed:', error);
    }
  }

  publishWalletUpdate(wallets) {
    this.broadcast({
      type: 'wallet-update',
      wallets,
    });
  }

  publishTradeUpdate(trades) {
    this.broadcast({
      type: 'trade-update',
      trades,
    });
  }

  publishAlert(alert) {
    if (!alert) return;
    this.broadcast({
      type: 'alert',
      alert,
    });
  }

  publishAlerts(alerts) {
    this.broadcast({
      type: 'alert',
      alerts,
    });
  }

  publishSystemStatus(status) {
    this.broadcast({
      type: 'system-status',
      ...status,
    });
  }
}

module.exports = new RealtimeService();
