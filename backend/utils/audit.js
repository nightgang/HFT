const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class AuditLogger {
  constructor() {
    this.auditLogPath = path.join(__dirname, '../logs/audit.log');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    const logDir = path.dirname(this.auditLogPath);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  async log(event, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      ...details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };

    const logLine = JSON.stringify(auditEntry) + '\n';

    try {
      await fs.appendFile(this.auditLogPath, logLine);
      logger.info(`Audit: ${event}`, details);
    } catch (error) {
      logger.error('Failed to write audit log:', error);
    }
  }

  // Specific audit events
  async logLoginAttempt(username, success, ip, userAgent) {
    await this.log('LOGIN_ATTEMPT', {
      username,
      success,
      ip,
      userAgent
    });
  }

  async logApiAccess(endpoint, method, user, ip, userAgent) {
    await this.log('API_ACCESS', {
      endpoint,
      method,
      user: user?.username || 'unknown',
      ip,
      userAgent
    });
  }

  async logTradeExecution(wallet, tokenMint, amount, type, success, ip, userAgent) {
    await this.log('TRADE_EXECUTION', {
      wallet: wallet.toString(),
      tokenMint,
      amount,
      type,
      success,
      ip,
      userAgent
    });
  }

  async logWalletOperation(operation, wallet, success, ip, userAgent) {
    await this.log('WALLET_OPERATION', {
      operation,
      wallet: wallet?.toString() || 'unknown',
      success,
      ip,
      userAgent
    });
  }

  async logWebhookReceived(source, dataSize, success, ip) {
    await this.log('WEBHOOK_RECEIVED', {
      source,
      dataSize,
      success,
      ip
    });
  }

  async logSecurityEvent(event, details, ip, userAgent) {
    await this.log('SECURITY_EVENT', {
      securityEvent: event,
      ...details,
      ip,
      userAgent
    });
  }
}

module.exports = new AuditLogger();