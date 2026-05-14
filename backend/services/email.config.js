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

      // Verify connection (don't throw on failure for development)
      this.transporter.verify((error, success) => {
        if (error) {
          console.warn('Email service verification failed: SMTP credentials may be invalid or service unavailable. Email functionality will be disabled.');
          console.warn('Error details:', error.message);
          // Don't throw error - allow service to continue without email
          this.transporter = null;
        } else {
          console.log('Email service is ready to send messages');
        }
      });

      return this.transporter;
    } catch (error) {
      console.warn('Failed to initialize email service:', error.message);
      console.warn('Email functionality will be disabled.');
      this.transporter = null;
      // Don't throw error - allow service to continue without email
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