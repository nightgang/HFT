// Graceful Shutdown Manager
const logger = require('../../utils/logger');

class GracefulShutdownManager {
  constructor() {
    this.listeners = [];
    this.isShuttingDown = false;
  }

  // Register shutdown listener
  registerListener(name, listener) {
    this.listeners.push({ name, listener });
    logger.info(`Registered shutdown listener: ${name}`);
  }

  // Initiate graceful shutdown
  async shutdown(reason = 'Unknown') {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Initiating graceful shutdown: ${reason}`);

    // Run all listeners in order
    for (const { name, listener } of this.listeners) {
      try {
        logger.info(`Executing shutdown listener: ${name}`);
        await Promise.race([
          listener(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout for ${name}`)), 30000)
          )
        ]);
        logger.info(`Shutdown listener completed: ${name}`);
      } catch (error) {
        logger.error(`Error in shutdown listener ${name}:`, error);
      }
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  }

  // Initialize signal handlers
  initializeSignalHandlers() {
    process.on('SIGTERM', () => {
      this.shutdown('SIGTERM received');
    });

    process.on('SIGINT', () => {
      this.shutdown('SIGINT received (Ctrl+C)');
    });
  }
}

module.exports = new GracefulShutdownManager();
