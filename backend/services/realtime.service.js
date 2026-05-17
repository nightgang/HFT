const websocketServer = require('../ws/websocket.server');

class RealtimeService {
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
