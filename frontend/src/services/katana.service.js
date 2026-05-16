/**
 * Katana service
 * Handles Katana terminal and CLI operations
 */

import api from './api';

class KatanaService {
  /**
   * Get terminal status
   */
  async getTerminalStatus() {
    try {
      return await api.get('/katana/status');
    } catch (error) {
      console.error('Failed to fetch terminal status:', error);
      throw error;
    }
  }

  /**
   * Execute command
   */
  async executeCommand(command) {
    try {
      return await api.post('/katana/execute', { command });
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  /**
   * Get command history
   */
  async getCommandHistory(limit = 100) {
    try {
      return await api.get(`/katana/history?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch command history:', error);
      throw error;
    }
  }

  /**
   * Get available commands
   */
  async getAvailableCommands() {
    try {
      return await api.get('/katana/commands');
    } catch (error) {
      console.error('Failed to fetch available commands:', error);
      throw error;
    }
  }

  /**
   * Get terminal logs
   */
  async getTerminalLogs(limit = 100) {
    try {
      return await api.get(`/katana/logs?limit=${limit}`);
    } catch (error) {
      console.error('Failed to fetch terminal logs:', error);
      throw error;
    }
  }

  /**
   * Clear terminal
   */
  async clearTerminal() {
    try {
      return await api.post('/katana/clear', {});
    } catch (error) {
      console.error('Failed to clear terminal:', error);
      throw error;
    }
  }
}

export default new KatanaService();
