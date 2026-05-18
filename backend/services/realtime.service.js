const websocketServer = require('../ws/websocket.server');

class RealtimeService {
  constructor() {
    this.eventUnsubscribers = [];
  }

  async initialize() {
    try {
      const eventBus = require('./event-bus.service');
      await eventBus.initialize();

      const subscribeChannel = async (channel, handler) => {
        const unsub = await eventBus.subscribe(channel, async (payload) => {
          try {
            await handler(payload);
          } catch (internalError) {
            console.error(`Failed to forward ${channel} to websocket:`, internalError);
          }
        });
        this.eventUnsubscribers.push(unsub);
      };

      await subscribeChannel('token.detected', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('ai.prediction', async (payload) => {
        const message = typeof payload === 'object' ? { type: 'ai-prediction', ...payload } : { type: 'ai-prediction', data: payload };
        this.broadcast(message);
      });

      await subscribeChannel('ai.signal', async (payload) => {
        const message = typeof payload === 'object' ? { type: 'ai-signal', signal: payload } : { type: 'ai-signal', data: payload };
        this.broadcast(message);
      });

      await subscribeChannel('trade.executed', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('trade.failed', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('trade.retry', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('risk.alert', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('katana.status', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('price.update', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('pnl.update', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('arbitrage.signal', async (payload) => {
        this.broadcast(payload);
      });

      await subscribeChannel('smartmoney.signal', async (payload) => {
        this.broadcast(payload);
      });

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
