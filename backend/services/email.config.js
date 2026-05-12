/**
 * Email Service Configuration
 * Handles SMTP settings and email templates for the HFT system
 */

const nodemailer = require('nodemailer');

class EmailConfig {
  constructor() {
    this.transporter = null;
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      // Additional security options
      tls: {
        rejectUnauthorized: false
      }
    };
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    try {
      this.transporter = nodemailer.createTransport(this.config);

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email service verification failed:', error);
        } else {
          console.log('Email service is ready to send messages');
        }
      });

      return this.transporter;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }

  /**
   * Get transporter instance
   */
  getTransporter() {
    if (!this.transporter) {
      throw new Error('Email service not initialized. Call initialize() first.');
    }
    return this.transporter;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.transporter) {
      this.transporter = nodemailer.createTransport(this.config);
    }
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig() {
    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      user: this.config.auth.user ? '***configured***' : 'not set'
    };
  }
}

module.exports = new EmailConfig();