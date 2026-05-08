const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('../ws/websocket.server');
const logger = require('../utils/logger');

jest.mock('../utils/logger');

describe('WebSocketServer Integration Tests', () => {
  let server;
  let port;

  beforeAll(() => {
    // Use a random port for testing
    port = 3003 + Math.floor(Math.random() * 100);
  });

  afterEach(() => {
    if (server && server.wss) {
      server.stop();
    }
  });

  describe('Server Lifecycle', () => {
    it('should start and stop the WebSocket server', (done) => {
      server = new WebSocketServer();

      server.start(port);

      // Wait a bit for server to start
      setTimeout(() => {
        expect(server.wss).toBeDefined();
        expect(server.port).toBe(port);
        expect(logger.info).toHaveBeenCalledWith(`WebSocket server started on port ${port}`);

        server.stop();
        expect(logger.info).toHaveBeenCalledWith('WebSocket server stopped');

        done();
      }, 100);
    });
  });

  describe('Client Connection and Authentication', () => {
    beforeEach(() => {
      server = new WebSocketServer();
      server.start(port);
    });

    it('should reject connection without authentication token', (done) => {
      const client = new WebSocket(`ws://localhost:${port}`);

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('ERROR');
        expect(message.error).toBe('Authentication required');
        expect(message.code).toBe('WS_AUTH_REQUIRED');
        client.close();
        done();
      });

      client.on('close', () => {
        // Connection should be closed by server
      });
    });

    it('should reject connection with invalid token', (done) => {
      const client = new WebSocket(`ws://localhost:${port}?token=invalid-token`);

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('ERROR');
        expect(message.error).toBe('Invalid authentication token');
        expect(message.code).toBe('WS_AUTH_INVALID');
        done();
      });
    });

    it('should accept connection with valid token', (done) => {
      const userData = {
        userId: 'user123',
        username: 'testuser',
        role: 'trader'
      };

      const token = jwt.sign(userData, process.env.JWT_SECRET || 'test-secret');

      const client = new WebSocket(`ws://localhost:${port}?token=${token}`);

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('AUTH_SUCCESS');
        expect(message.user).toEqual(expect.objectContaining(userData));
        expect(message.timestamp).toBeDefined();

        // Check server state
        expect(server.getClientCount()).toBe(1);
        expect(server.authenticatedClients.size).toBe(1);

        client.close();
        done();
      });
    });

    it('should handle multiple authenticated clients', (done) => {
      const user1 = { userId: 'user1', username: 'user1' };
      const user2 = { userId: 'user2', username: 'user2' };

      const token1 = jwt.sign(user1, process.env.JWT_SECRET || 'test-secret');
      const token2 = jwt.sign(user2, process.env.JWT_SECRET || 'test-secret');

      const client1 = new WebSocket(`ws://localhost:${port}?token=${token1}`);
      const client2 = new WebSocket(`ws://localhost:${port}?token=${token2}`);

      let authCount = 0;

      const checkCompletion = () => {
        if (authCount === 2) {
          expect(server.getClientCount()).toBe(2);
          expect(server.authenticatedClients.size).toBe(2);

          client1.close();
          client2.close();
          done();
        }
      };

      client1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'AUTH_SUCCESS') {
          authCount++;
          checkCompletion();
        }
      });

      client2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'AUTH_SUCCESS') {
          authCount++;
          checkCompletion();
        }
      });
    });
  });

  describe('Message Handling', () => {
    let client;
    let token;

    beforeEach((done) => {
      server = new WebSocketServer();
      server.start(port);

      const userData = { userId: 'user123', username: 'testuser' };
      token = jwt.sign(userData, process.env.JWT_SECRET || 'test-secret');

      client = new WebSocket(`ws://localhost:${port}?token=${token}`);

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'AUTH_SUCCESS') {
          done();
        }
      });
    });

    afterEach(() => {
      if (client) {
        client.close();
      }
    });

    it('should handle valid JSON messages', (done) => {
      const testMessage = {
        type: 'TEST_MESSAGE',
        data: { key: 'value' }
      };

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'ACK') {
          expect(message.timestamp).toBeDefined();
          done();
        }
      });

      client.send(JSON.stringify(testMessage));
    });

    it('should handle invalid JSON messages gracefully', (done) => {
      // Send invalid JSON
      client.send('invalid json');

      // Server should not crash, and connection should remain open
      setTimeout(() => {
        expect(client.readyState).toBe(WebSocket.OPEN);
        done();
      }, 100);
    });

    it('should handle client disconnection', (done) => {
      expect(server.getClientCount()).toBe(1);

      client.close();

      // Wait for close event to be processed
      setTimeout(() => {
        expect(server.getClientCount()).toBe(0);
        expect(server.authenticatedClients.size).toBe(0);
        done();
      }, 100);
    });
  });

  describe('Broadcast Functionality', () => {
    let client1, client2;
    let token1, token2;

    beforeEach((done) => {
      server = new WebSocketServer();
      server.start(port);

      const user1 = { userId: 'user1', username: 'user1' };
      const user2 = { userId: 'user2', username: 'user2' };

      token1 = jwt.sign(user1, process.env.JWT_SECRET || 'test-secret');
      token2 = jwt.sign(user2, process.env.JWT_SECRET || 'test-secret');

      client1 = new WebSocket(`ws://localhost:${port}?token=${token1}`);
      client2 = new WebSocket(`ws://localhost:${port}?token=${token2}`);

      let authCount = 0;
      const checkAuth = () => {
        authCount++;
        if (authCount === 2) {
          done();
        }
      };

      client1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'AUTH_SUCCESS') checkAuth();
      });

      client2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'AUTH_SUCCESS') checkAuth();
      });
    });

    afterEach(() => {
      if (client1) client1.close();
      if (client2) client2.close();
    });

    it('should broadcast messages to all authenticated clients', (done) => {
      const broadcastData = {
        type: 'TRADE_UPDATE',
        data: {
          token: 'SOL',
          price: 100,
          volume: 1000
        }
      };

      let receivedCount = 0;
      const checkReceived = () => {
        receivedCount++;
        if (receivedCount === 2) {
          done();
        }
      };

      client1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'TRADE_UPDATE') {
          expect(message.data).toEqual(broadcastData.data);
          expect(message.serverTimestamp).toBeDefined();
          checkReceived();
        }
      });

      client2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'TRADE_UPDATE') {
          expect(message.data).toEqual(broadcastData.data);
          expect(message.serverTimestamp).toBeDefined();
          checkReceived();
        }
      });

      // Wait a bit for clients to be ready
      setTimeout(() => {
        server.broadcast(broadcastData);
      }, 50);
    });

    it('should not broadcast to unauthenticated clients', (done) => {
      const broadcastData = {
        type: 'SYSTEM_ALERT',
        message: 'Test alert'
      };

      // Close one client to simulate disconnection
      client1.close();

      setTimeout(() => {
        // Only client2 should be authenticated now
        expect(server.authenticatedClients.size).toBe(1);

        let receivedMessage = false;

        client2.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'SYSTEM_ALERT') {
            receivedMessage = true;
          }
        });

        server.broadcast(broadcastData);

        setTimeout(() => {
          expect(receivedMessage).toBe(true);
          done();
        }, 100);
      }, 100);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      server = new WebSocketServer();
      server.start(port);
    });

    it('should handle client errors gracefully', (done) => {
      const userData = { userId: 'user123', username: 'testuser' };
      const token = jwt.sign(userData, process.env.JWT_SECRET || 'test-secret');

      const client = new WebSocket(`ws://localhost:${port}?token=${token}`);

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'AUTH_SUCCESS') {
          // Force an error by sending malformed data that causes issues
          client.send('malformed data that might cause issues');

          setTimeout(() => {
            // Connection should still be open despite the error
            expect(client.readyState).toBe(WebSocket.OPEN);
            client.close();
            done();
          }, 100);
        }
      });
    });

    it('should clean up clients on connection errors', (done) => {
      const userData = { userId: 'user123', username: 'testuser' };
      const token = jwt.sign(userData, process.env.JWT_SECRET || 'test-secret');

      const client = new WebSocket(`ws://localhost:${port}?token=${token}`);

      client.on('error', () => {
        // Prevent unhandled error events from failing the test
      });

      client.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'AUTH_SUCCESS') {
          expect(server.getClientCount()).toBe(1);

          // Simulate connection error by terminating the client
          client.terminate();

          setTimeout(() => {
            expect(server.getClientCount()).toBe(0);
            expect(server.authenticatedClients.size).toBe(0);
            done();
          }, 100);
        }
      });
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple concurrent connections', (done) => {
      server = new WebSocketServer();
      server.start(port);

      const clientCount = 10;
      const clients = [];
      let connectedCount = 0;
      let authCount = 0;

      for (let i = 0; i < clientCount; i++) {
        const userData = { userId: `user${i}`, username: `user${i}` };
        const token = jwt.sign(userData, process.env.JWT_SECRET || 'test-secret');

        const client = new WebSocket(`ws://localhost:${port}?token=${token}`);
        clients.push(client);

        client.on('open', () => {
          connectedCount++;
        });

        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'AUTH_SUCCESS') {
            authCount++;
            if (authCount === clientCount) {
              expect(server.getClientCount()).toBe(clientCount);
              expect(server.authenticatedClients.size).toBe(clientCount);

              // Clean up
              clients.forEach(client => client.close());
              done();
            }
          }
        });
      }
    });

    it('should handle broadcast performance with multiple clients', (done) => {
      server = new WebSocketServer();
      server.start(port);

      const clientCount = 5;
      const clients = [];
      let readyCount = 0;

      // Create multiple clients
      for (let i = 0; i < clientCount; i++) {
        const userData = { userId: `user${i}`, username: `user${i}` };
        const token = jwt.sign(userData, process.env.JWT_SECRET || 'test-secret');

        const client = new WebSocket(`ws://localhost:${port}?token=${token}`);
        clients.push(client);

        client.on('message', (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === 'AUTH_SUCCESS') {
            readyCount++;
            if (readyCount === clientCount) {
              // All clients ready, now test broadcast
              const startTime = Date.now();
              const broadcastData = {
                type: 'PERFORMANCE_TEST',
                data: { testId: 'broadcast_perf' }
              };

              let receivedCount = 0;

              clients.forEach(client => {
                client.on('message', (data) => {
                  const message = JSON.parse(data.toString());
                  if (message.type === 'PERFORMANCE_TEST') {
                    receivedCount++;
                    if (receivedCount === clientCount) {
                      const endTime = Date.now();
                      const broadcastTime = endTime - startTime;

                      // Broadcast should complete within reasonable time
                      expect(broadcastTime).toBeLessThan(1000);
                      expect(logger.debug).toHaveBeenCalledWith(
                        `Broadcasted message to ${clientCount} authenticated clients: PERFORMANCE_TEST`
                      );

                      clients.forEach(client => client.close());
                      done();
                    }
                  }
                });
              });

              server.broadcast(broadcastData);
            }
          }
        });
      }
    });
  });
});