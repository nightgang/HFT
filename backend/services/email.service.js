/**
 * Email Service for HFT System
 * Handles automated email notifications and reports
 */

const emailConfig = require('./email.config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.initialized = false;
    this.templates = {
      weeklyReport: this.weeklyReportTemplate.bind(this),
      tradeAlert: this.tradeAlertTemplate.bind(this),
      systemAlert: this.systemAlertTemplate.bind(this)
    };
  }

  /**
   * Initialize email service
   */
  async initialize() {
    try {
      emailConfig.initialize();
      this.initialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize email service:', error.message);
      logger.warn('Email functionality will be disabled, but server will continue.');
      // Don't throw error - allow server to continue without email
    }
  }

  /**
   * Send email with template
   */
  async sendEmail(to, subject, templateName, data = {}) {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    try {
      const transporter = emailConfig.getTransporter();
      const template = this.templates[templateName];

      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      const { html, text } = template(data);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text
      };

      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send weekly performance report
   */
  async sendWeeklyReport(email, reportData) {
    const subject = `HFT Weekly Performance Report - ${new Date().toLocaleDateString()}`;
    return this.sendEmail(email, subject, 'weeklyReport', reportData);
  }

  /**
   * Send trade alert
   */
  async sendTradeAlert(email, tradeData) {
    const subject = `HFT Trade Alert: ${tradeData.type} - ${tradeData.symbol}`;
    return this.sendEmail(email, subject, 'tradeAlert', tradeData);
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(email, alertData) {
    const subject = `HFT System Alert: ${alertData.level} - ${alertData.title}`;
    return this.sendEmail(email, subject, 'systemAlert', alertData);
  }

  /**
   * Test email configuration
   */
  async testConfiguration(email) {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    try {
      const testData = {
        level: 'info',
        title: 'Email Test',
        message: 'This is a test email from your HFT Trading System.',
        timestamp: new Date().toISOString(),
        details: {
          'Test Time': new Date().toLocaleString(),
          'Service Status': 'Active'
        }
      };

      await this.sendSystemAlert(email, testData);

      return {
        success: true,
        message: 'Test email sent successfully',
        email
      };
    } catch (error) {
      logger.error('Email test failed:', error);
      return {
        success: false,
        error: error.message,
        email
      };
    }
  }

  /**
   * Weekly report email template
   */
  weeklyReportTemplate(data) {
    const {
      totalTrades = 0,
      profitableTrades = 0,
      totalPnL = 0,
      winRate = 0,
      bestTrade = 0,
      worstTrade = 0,
      totalVolume = 0,
      topPerformers = [],
      alerts = []
    } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>HFT Weekly Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
          .metric { display: inline-block; width: 45%; margin: 10px 2%; background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
          .metric h3 { margin: 0; color: #007bff; font-size: 24px; }
          .metric p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
          .section { margin: 30px 0; }
          .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          .trade-list { list-style: none; padding: 0; }
          .trade-item { padding: 10px; border-bottom: 1px solid #eee; }
          .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HFT Weekly Performance Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <h2>Key Metrics</h2>
            <div class="metric">
              <h3 class="${totalPnL >= 0 ? 'positive' : 'negative'}">${totalPnL.toFixed(2)} SOL</h3>
              <p>Total P&L</p>
            </div>
            <div class="metric">
              <h3>${winRate.toFixed(1)}%</h3>
              <p>Win Rate</p>
            </div>
            <div class="metric">
              <h3>${totalTrades}</h3>
              <p>Total Trades</p>
            </div>
            <div class="metric">
              <h3>${totalVolume.toFixed(2)} SOL</h3>
              <p>Total Volume</p>
            </div>
            <div class="metric">
              <h3 class="positive">${bestTrade.toFixed(2)} SOL</h3>
              <p>Best Trade</p>
            </div>
            <div class="metric">
              <h3 class="negative">${worstTrade.toFixed(2)} SOL</h3>
              <p>Worst Trade</p>
            </div>
          </div>

          ${topPerformers.length > 0 ? `
          <div class="section">
            <h2>Top Performing Trades</h2>
            <ul class="trade-list">
              ${topPerformers.map(trade => `
                <li class="trade-item">
                  <strong>${trade.symbol}</strong> - ${trade.side} ${trade.amount} @ ${trade.price} SOL
                  <span class="${trade.pnl >= 0 ? 'positive' : 'negative'}">P&L: ${trade.pnl.toFixed(2)} SOL</span>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          ${alerts.length > 0 ? `
          <div class="section">
            <h2>System Alerts</h2>
            ${alerts.map(alert => `
              <div class="alert">
                <strong>${alert.level.toUpperCase()}:</strong> ${alert.message}
                <br><small>${new Date(alert.timestamp).toLocaleString()}</small>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="footer">
            <p>This report was generated automatically by the HFT Trading System.</p>
            <p>For questions or concerns, please contact the system administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
HFT Weekly Performance Report - ${new Date().toLocaleDateString()}

KEY METRICS:
- Total P&L: ${totalPnL.toFixed(2)} SOL
- Win Rate: ${winRate.toFixed(1)}%
- Total Trades: ${totalTrades}
- Total Volume: ${totalVolume.toFixed(2)} SOL
- Best Trade: ${bestTrade.toFixed(2)} SOL
- Worst Trade: ${worstTrade.toFixed(2)} SOL

${topPerformers.length > 0 ? `
TOP PERFORMING TRADES:
${topPerformers.map(trade => `- ${trade.symbol} - ${trade.side} ${trade.amount} @ ${trade.price} SOL (P&L: ${trade.pnl.toFixed(2)} SOL)`).join('\n')}

` : ''}${alerts.length > 0 ? `
SYSTEM ALERTS:
${alerts.map(alert => `- ${alert.level.toUpperCase()}: ${alert.message} (${new Date(alert.timestamp).toLocaleString()})`).join('\n')}

` : ''}This report was generated automatically by the HFT Trading System.
    `;

    return { html, text };
  }

  /**
   * Trade alert email template
   */
  tradeAlertTemplate(data) {
    const { type, symbol, side, amount, price, pnl, timestamp } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>HFT Trade Alert</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .alert { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 5px; text-align: center; }
          .details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; }
          .value { text-align: right; }
          .pnl-positive { color: #28a745; font-weight: bold; }
          .pnl-negative { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h2>HFT Trade Executed</h2>
            <p>A ${type} trade has been completed</p>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="label">Symbol:</span>
              <span class="value">${symbol}</span>
            </div>
            <div class="detail-row">
              <span class="label">Side:</span>
              <span class="value">${side}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value">${amount}</span>
            </div>
            <div class="detail-row">
              <span class="label">Price:</span>
              <span class="value">${price} SOL</span>
            </div>
            <div class="detail-row">
              <span class="label">P&L:</span>
              <span class="value ${pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}">${pnl.toFixed(2)} SOL</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span>
              <span class="value">${new Date(timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
HFT Trade Alert

A ${type} trade has been completed.

Details:
- Symbol: ${symbol}
- Side: ${side}
- Amount: ${amount}
- Price: ${price} SOL
- P&L: ${pnl.toFixed(2)} SOL
- Time: ${new Date(timestamp).toLocaleString()}
    `;

    return { html, text };
  }

  /**
   * System alert email template
   */
  systemAlertTemplate(data) {
    const { level, title, message, timestamp, details = {} } = data;

    const levelColors = {
      info: '#d1ecf1',
      warning: '#fff3cd',
      error: '#f8d7da',
      critical: '#f5c6cb'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>HFT System Alert</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .alert { background-color: ${levelColors[level] || '#f8f9fa'}; border: 1px solid #dee2e6; padding: 20px; border-radius: 5px; text-align: center; }
          .alert h2 { margin: 0; color: #333; }
          .message { margin: 20px 0; font-size: 16px; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .label { font-weight: bold; }
          .timestamp { color: #666; font-size: 14px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h2>${level.toUpperCase()}: ${title}</h2>
          </div>

          <div class="message">
            ${message}
          </div>

          ${Object.keys(details).length > 0 ? `
          <div class="details">
            ${Object.entries(details).map(([key, value]) => `
              <div class="detail-row">
                <span class="label">${key}:</span>
                <span>${value}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="timestamp">
            Alert generated at ${new Date(timestamp).toLocaleString()}
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
HFT System Alert

${level.toUpperCase()}: ${title}

${message}

${Object.keys(details).length > 0 ? `
Details:
${Object.entries(details).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

` : ''}Alert generated at ${new Date(timestamp).toLocaleString()}
    `;

    return { html, text };
  }
}

module.exports = new EmailService();