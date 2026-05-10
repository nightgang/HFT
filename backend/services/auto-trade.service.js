const logger = require('../utils/logger');

/**
 * Auto Trade State Service
 * Manages the global AUTO_TRADE on/off state
 * Shared between API, WebSocket, and terminal
 */
class AutoTradeService {
  constructor() {
    // Initialize from environment variable or default to true
    this.isEnabled = process.env.AUTO_TRADE === 'false' ? false : true;
    this.listeners = new Set();
    logger.info(`Auto Trade Service initialized. Status: ${this.isEnabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Get current auto trade status
   */
  isAutoTradeEnabled() {
    return this.isEnabled;
  }

  /**
   * Toggle auto trade ON/OFF
   */
  toggle() {
    this.isEnabled = !this.isEnabled;
    logger.info(`Auto Trade toggled: ${this.isEnabled ? 'ON' : 'OFF'}`);
    this.notifyListeners();
    return this.isEnabled;
  }

  /**
   * Set auto trade status explicitly
   */
  setStatus(enabled) {
    const wasEnabled = this.isEnabled;
    this.isEnabled = Boolean(enabled);
    
    if (wasEnabled !== this.isEnabled) {
      logger.info(`Auto Trade status changed: ${this.isEnabled ? 'ON' : 'OFF'}`);
      this.notifyListeners();
    }
    
    return this.isEnabled;
  }

  /**
   * Register a listener for status changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners() {
    const status = {
      enabled: this.isEnabled,
      timestamp: new Date().toISOString(),
      status: this.isEnabled ? 'ON' : 'OFF'
    };
    
    for (const callback of this.listeners) {
      try {
        callback(status);
      } catch (error) {
        logger.error('Error in auto-trade listener:', error);
      }
    }
  }

  /**
   * Get status details
   */
  getStatus() {
    return {
      success: true,
      AUTO_TRADE: this.isEnabled,
      status: this.isEnabled ? 'ON' : 'OFF',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if trade should be executed
   * Logs skip message if AUTO_TRADE is OFF
   */
  canExecuteTrade() {
    if (!this.isEnabled) {
      logger.warn('AUTO TRADE OFF - Trade skipped');
    }
    return this.isEnabled;
  }

  /**
   * Get formatted status for terminal display
   */
  getTerminalStatus() {
    const emoji = this.isEnabled ? '🟢' : '🔴';
    const color = this.isEnabled ? '\x1b[32m' : '\x1b[31m'; // Green or Red
    const reset = '\x1b[0m';
    
    return {
      display: `${emoji} AUTO TRADE : ${color}${this.isEnabled ? 'ON' : 'OFF'}${reset}`,
      raw: `AUTO TRADE : ${this.isEnabled ? 'ON' : 'OFF'}`,
      enabled: this.isEnabled,
      emoji
    };
  }
}

// Singleton instance
const autoTradeService = new AutoTradeService();

module.exports = autoTradeService;
