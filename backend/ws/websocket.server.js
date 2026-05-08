const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketServer {
  constructor(port = 3002) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
    this.authenticatedClients = new Map(); // ws -> user data
  }

  start(port = this.port) {
    this.port = port;
    this.wss = new WebSocket.Server({ port: this.port });
    logger.info(`WebSocket server started on port ${this.port}`);

    this.wss.on('connection', (ws, req) => {
      logger.info('New WebSocket client connected');

      // Check for authentication token in query parameters
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          error: 'Authentication required',
          code: 'WS_AUTH_REQUIRED'
        }));
        ws.close();
        return;
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        this.authenticatedClients.set(ws, decoded);
        this.clients.add(ws);
        logger.info(`WebSocket client authenticated: ${decoded.username}`);

        ws.send(JSON.stringify({
          type: 'AUTH_SUCCESS',
          user: decoded,
          timestamp: Date.now()
        }));
      } catch (error) {
        logger.warn('WebSocket authentication failed:', error.message);
        ws.send(JSON.stringify({
          type: 'ERROR',
          error: 'Invalid authentication token',
          code: 'WS_AUTH_INVALID'
        }));
        ws.close();
        return;
      }

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
        this.authenticatedClients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
        this.authenticatedClients.delete(ws);
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
      if (client.readyState === WebSocket.OPEN && this.authenticatedClients.has(client)) {
        try {
          client.send(message);
          sentCount++;
        } catch (error) {
          logger.error('Broadcast error:', error);
          this.clients.delete(client);
          this.authenticatedClients.delete(client);
        }
      }
    }

    logger.debug(`Broadcasted message to ${sentCount} authenticated clients: ${data.type}`);
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
module.exports.WebSocketServer = WebSocketServer;