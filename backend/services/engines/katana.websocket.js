/**
 * Katana WebSocket Service
 *
 * Real-time communication service for Katana Mode.
 * Handles live token feeds, trading updates, PnL monitoring,
 * and dashboard synchronization.
 *
 * Features:
 * - Live token detection broadcasts
 * - Real-time price updates
 * - Trade execution notifications
 * - PnL streaming
 * - Risk alerts
 * - Dashboard state synchronization
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

class KatanaWebSocket extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.port = parseInt(process.env.KATANA_WS_PORT) || 3003;
    this.clients = new Map(); // ws -> client data
    this.authenticatedClients = new Map();
    this.subscriptions = new Map(); // client -> subscriptions

    this.config = {
      heartbeatInterval: parseInt(process.env.KATANA_WS_HEARTBEAT) || 30000, // 30 seconds
      maxClients: parseInt(process.env.KATANA_WS_MAX_CLIENTS) || 100,
      rateLimit: {
        windowMs: 1000, // 1 second
        maxMessages: 10 // 10 messages per second
      }
    };

    this.messageCounts = new Map(); // Track rate limiting
  }

  async initialize() {
    logger.info('🔌 Initializing Katana WebSocket Service');

    this.wss = new WebSocket.Server({
      port: this.port,
      perMessageDeflate: false,
      maxPayload: 1024 * 1024 // 1MB max payload
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', (error) => {
      logger.error('Katana WebSocket server error:', error);
    });

    // Start heartbeat
    this.startHeartbeat();

    // Start rate limit cleanup
    this.startRateLimitCleanup();

    logger.info(`✅ Katana WebSocket server started on port ${this.port}`);
  }

  async shutdown() {
    logger.info('🛑 Shutting down Katana WebSocket Service');

    // Close all client connections
    for (const [ws, client] of this.clients) {
      try {
        ws.close(1000, 'Server shutdown');
      } catch (error) {
        logger.debug('Error closing client connection:', error.message);
      }
    }

    if (this.wss) {
      this.wss.close();
    }

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.rateLimitCleanupInterval) {
      clearInterval(this.rateLimitCleanupInterval);
    }
  }

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const client = {
      id: clientId,
      ws,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      subscriptions: new Set(),
      authenticated: false
    };

    this.clients.set(ws, client);
    this.messageCounts.set(clientId, { count: 0, windowStart: Date.now() });

    logger.info(`🔗 New Katana WS client connected: ${clientId}`);

    // Check authentication
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        client.authenticated = true;
        client.user = decoded;
        this.authenticatedClients.set(ws, decoded);
        logger.info(`🔐 Katana WS client authenticated: ${decoded.username}`);
      } catch (error) {
        logger.warn('Katana WS authentication failed:', error.message);
        ws.send(JSON.stringify({
          type: 'ERROR',
          error: 'Invalid authentication token',
          code: 'WS_AUTH_FAILED'
        }));
        ws.close();
        return;
      }
    }

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'WELCOME',
      clientId,
      authenticated: client.authenticated,
      timestamp: Date.now()
    }));

    // Set up event handlers
    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('close', () => this.handleDisconnection(ws));
    ws.on('error', (error) => this.handleError(ws, error));
    ws.on('pong', () => this.handlePong(ws));
  }

  handleMessage(ws, data) {
    try {
      const client = this.clients.get(ws);
      if (!client) return;

      // Rate limiting
      if (!this.checkRateLimit(client.id)) {
        ws.send(JSON.stringify({
          type: 'ERROR',
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT'
        }));
        return;
      }

      const message = JSON.parse(data.toString());
      logger.debug(`📨 Katana WS message from ${client.id}: ${message.type}`);

      // Handle different message types
      switch (message.type) {
        case 'SUBSCRIBE':
          this.handleSubscribe(ws, message);
          break;
        case 'UNSUBSCRIBE':
          this.handleUnsubscribe(ws, message);
          break;
        case 'COMMAND':
          this.handleCommand(ws, message);
          break;
        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }

    } catch (error) {
      logger.error('Error handling WS message:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: 'Invalid message format',
        code: 'INVALID_MESSAGE'
      }));
    }
  }

  handleSubscribe(ws, message) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { channels } = message;
    if (!Array.isArray(channels)) return;

    channels.forEach(channel => {
      client.subscriptions.add(channel);
    });

    ws.send(JSON.stringify({
      type: 'SUBSCRIBED',
      channels: Array.from(client.subscriptions),
      timestamp: Date.now()
    }));

    logger.debug(`📡 Client ${client.id} subscribed to: ${channels.join(', ')}`);
  }

  handleUnsubscribe(ws, message) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { channels } = message;
    if (!Array.isArray(channels)) return;

    channels.forEach(channel => {
      client.subscriptions.delete(channel);
    });

    ws.send(JSON.stringify({
      type: 'UNSUBSCRIBED',
      channels: Array.from(client.subscriptions),
      timestamp: Date.now()
    }));
  }

  handleCommand(ws, message) {
    const client = this.clients.get(ws);
    if (!client || !client.authenticated) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: 'Authentication required for commands',
        code: 'AUTH_REQUIRED'
      }));
      return;
    }

    // Emit command event for the main engine to handle
    this.emit('command', {
      clientId: client.id,
      user: client.user,
      command: message.command,
      params: message.params,
      timestamp: Date.now()
    });
  }

  handleDisconnection(ws) {
    const client = this.clients.get(ws);
    if (client) {
      logger.info(`🔌 Katana WS client disconnected: ${client.id}`);
      this.clients.delete(ws);
      this.authenticatedClients.delete(ws);
      this.messageCounts.delete(client.id);
    }
  }

  handleError(ws, error) {
    const client = this.clients.get(ws);
    logger.error(`Katana WS client error ${client?.id}:`, error.message);
  }

  handlePong(ws) {
    const client = this.clients.get(ws);
    if (client) {
      client.lastHeartbeat = Date.now();
    }
  }

  // Broadcasting methods
  broadcast(message, filterFn = null) {
    if (!this.wss) return;

    let sentCount = 0;
    for (const [ws, client] of this.clients) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          if (!filterFn || filterFn(client)) {
            ws.send(JSON.stringify(message));
            sentCount++;
          }
        }
      } catch (error) {
        logger.debug(`Failed to send message to client ${client.id}:`, error.message);
      }
    }

    logger.debug(`📢 Broadcasted ${message.type} to ${sentCount} clients`);
  }

  broadcastToAuthenticated(message) {
    this.broadcast(message, client => client.authenticated);
  }

  broadcastTokenDetected(tokenData, riskLevel) {
    this.broadcast({
      type: 'TOKEN_DETECTED',
      data: { ...tokenData, riskLevel },
      timestamp: Date.now()
    });
  }

  broadcastPriceUpdate(tokenMint, price, liquidity) {
    this.broadcast({
      type: 'PRICE_UPDATE',
      data: { tokenMint, price, liquidity },
      timestamp: Date.now()
    }, client => client.subscriptions.has('prices') || client.subscriptions.has(`price_${tokenMint}`));
  }

  broadcastTradeUpdate(tradeData) {
    this.broadcastToAuthenticated({
      type: 'TRADE_UPDATE',
      data: tradeData,
      timestamp: Date.now()
    });
  }

  broadcastTradeFailure(tradeData) {
    this.broadcastToAuthenticated({
      type: 'TRADE_FAILURE',
      data: tradeData,
      timestamp: Date.now()
    });
  }

  broadcastPnLUpdate(pnlData) {
    this.broadcastToAuthenticated({
      type: 'PNL_UPDATE',
      data: pnlData,
      timestamp: Date.now()
    });
  }

  broadcastRiskAlert(alertData) {
    this.broadcastToAuthenticated({
      type: 'RISK_ALERT',
      data: alertData,
      timestamp: Date.now()
    });
  }

  sendStatus(clientId, statusData) {
    // Find client by ID and send direct message
    for (const [ws, client] of this.clients) {
      if (client.id === clientId && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            type: 'STATUS',
            data: statusData,
            timestamp: Date.now()
          }));
        } catch (error) {
          logger.debug(`Failed to send status to client ${clientId}:`, error.message);
        }
        break;
      }
    }
  }

  // Heartbeat management
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const [ws, client] of this.clients) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            // Check if client is still responsive
            if (now - client.lastHeartbeat > this.config.heartbeatInterval * 2) {
              logger.warn(`Client ${client.id} missed heartbeat, closing connection`);
              ws.close(1000, 'Heartbeat timeout');
              continue;
            }

            // Send ping
            ws.ping();
          }
        } catch (error) {
          logger.debug(`Heartbeat failed for client ${client.id}:`, error.message);
        }
      }
    }, this.config.heartbeatInterval);
  }

  // Rate limiting
  checkRateLimit(clientId) {
    const now = Date.now();
    const clientLimit = this.messageCounts.get(clientId);

    if (!clientLimit) return true;

    // Reset window if needed
    if (now - clientLimit.windowStart >= this.config.rateLimit.windowMs) {
      clientLimit.count = 0;
      clientLimit.windowStart = now;
    }

    // Check limit
    if (clientLimit.count >= this.config.rateLimit.maxMessages) {
      return false;
    }

    clientLimit.count++;
    return true;
  }

  startRateLimitCleanup() {
    this.rateLimitCleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredClients = [];

      for (const [clientId, limit] of this.messageCounts) {
        if (now - limit.windowStart >= this.config.rateLimit.windowMs * 2) {
          expiredClients.push(clientId);
        }
      }

      expiredClients.forEach(clientId => {
        this.messageCounts.delete(clientId);
      });

      if (expiredClients.length > 0) {
        logger.debug(`Cleaned up rate limit data for ${expiredClients.length} clients`);
      }
    }, this.config.rateLimit.windowMs);
  }

  generateClientId() {
    return `katana_ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      authenticatedClients: this.authenticatedClients.size,
      port: this.port,
      config: this.config
    };
  }
}

module.exports = KatanaWebSocket;
