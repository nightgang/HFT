const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketServer {
  constructor(port = 3002) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
  }

  start(port = this.port) {
    this.port = port;
    this.wss = new WebSocket.Server({ port: this.port });
    logger.info(`WebSocket server started on port ${this.port}`);

    this.wss.on('connection', (ws) => {
      logger.info('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error('WebSocket message parse error:', error);
        }
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  handleMessage(ws, data) {
    // Handle incoming messages from clients
    logger.info('Received WebSocket message:', data);

    // Echo back for now - can be extended for client commands
    ws.send(JSON.stringify({
      type: 'ACK',
      timestamp: Date.now(),
    }));
  }

  broadcast(data) {
    const message = JSON.stringify({
      ...data,
      serverTimestamp: Date.now(),
    });

    let sentCount = 0;
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          sentCount++;
        } catch (error) {
          logger.error('Broadcast error:', error);
          this.clients.delete(client);
        }
      }
    }

    logger.debug(`Broadcasted message to ${sentCount} clients: ${data.type}`);
  }

  getClientCount() {
    return this.clients.size;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket server stopped');
    }
  }
}

module.exports = new WebSocketServer();