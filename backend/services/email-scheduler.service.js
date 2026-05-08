/**
 * Email Scheduler Service
 * Handles automated scheduling of email reports
 */

const cron = require('node-cron');
const emailService = require('./email.service');
const diContainer = require('./di-container');
const logger = require('../utils/logger');

class EmailScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the email scheduler
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Email scheduler is already running');
      return;
    }

    try {
      // Schedule weekly reports every Sunday at 9 AM
      const weeklyJob = cron.schedule('0 9 * * 0', async () => {
        await this.sendWeeklyReports();
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.scheduledJobs.set('weekly', weeklyJob);
      weeklyJob.start();

      // Schedule daily summary every day at 6 PM
      const dailyJob = cron.schedule('0 18 * * *', async () => {
        await this.sendDailySummaries();
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.scheduledJobs.set('daily', dailyJob);
      dailyJob.start();

      this.isRunning = true;
      logger.info('Email scheduler started successfully');
    } catch (error) {
      logger.error('Failed to start email scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop the email scheduler
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    for (const [name, job] of this.scheduledJobs) {
      job.stop();
      logger.info(`Stopped ${name} email job`);
    }

    this.scheduledJobs.clear();
    this.isRunning = false;
    logger.info('Email scheduler stopped');
  }

  /**
   * Send weekly reports to all subscribed wallets
   */
  async sendWeeklyReports() {
    try {
      logger.info('Starting weekly report generation');

      // Get all wallets that have email subscriptions
      // This would typically come from a database table
      const subscribedWallets = await this.getSubscribedWallets();

      for (const wallet of subscribedWallets) {
        try {
          // Generate analytics for the past week
          const executionAnalyticsService = diContainer.get('executionAnalyticsService');
          const analytics = await executionAnalyticsService.generateExecutionAnalytics(wallet.id, 7);

          const reportData = {
            totalTrades: analytics.totalTrades,
            profitableTrades: Math.floor(analytics.totalTrades * analytics.successRate / 100),
            totalPnL: analytics.pnl,
            winRate: analytics.successRate,
            bestTrade: analytics.bestTrade || 0,
            worstTrade: analytics.worstTrade || 0,
            totalVolume: analytics.totalVolume,
            topPerformers: analytics.topPerformers || [],
            alerts: analytics.alerts || []
          };

          await emailService.sendWeeklyReport(wallet.email, reportData);
          logger.info(`Weekly report sent to ${wallet.email} for wallet ${wallet.id}`);

          // Add small delay to avoid overwhelming email service
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          logger.error(`Failed to send weekly report for wallet ${wallet.id}:`, error);
        }
      }

      logger.info('Weekly report generation completed');
    } catch (error) {
      logger.error('Error in weekly report generation:', error);
    }
  }

  /**
   * Send daily summaries to all subscribed wallets
   */
  async sendDailySummaries() {
    try {
      logger.info('Starting daily summary generation');

      const subscribedWallets = await this.getSubscribedWallets();

      for (const wallet of subscribedWallets) {
        try {
          // Generate analytics for the past day
          const executionAnalyticsService = diContainer.get('executionAnalyticsService');
          const analytics = await executionAnalyticsService.generateExecutionAnalytics(wallet.id, 1);

          const summaryData = {
            level: 'info',
            title: 'Daily Trading Summary',
            message: `Daily summary for ${new Date().toLocaleDateString()}: ${analytics.totalTrades} trades, P&L: ${analytics.pnl.toFixed(2)} SOL`,
            timestamp: new Date().toISOString(),
            details: {
              'Total Trades': analytics.totalTrades,
              'Success Rate': `${analytics.successRate}%`,
              'P&L': `${analytics.pnl.toFixed(2)} SOL`,
              'Total Volume': `${analytics.totalVolume.toFixed(2)} SOL`,
              'Average Execution Time': `${analytics.averageExecutionTime}s`,
              'Average Slippage': `${analytics.averageSlippage} bps`
            }
          };

          await emailService.sendSystemAlert(wallet.email, summaryData);
          logger.info(`Daily summary sent to ${wallet.email} for wallet ${wallet.id}`);

          // Add small delay
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.error(`Failed to send daily summary for wallet ${wallet.id}:`, error);
        }
      }

      logger.info('Daily summary generation completed');
    } catch (error) {
      logger.error('Error in daily summary generation:', error);
    }
  }

  /**
   * Get list of wallets subscribed to email notifications
   * This is a placeholder - in production this would query a database
   */
  async getSubscribedWallets() {
    // Placeholder implementation
    // In production, this would query a database table for wallet subscriptions
    return [
      {
        id: 'demo-wallet-1',
        email: process.env.ADMIN_EMAIL || 'admin@example.com'
      }
    ];
  }

  /**
   * Manually trigger weekly reports
   */
  async triggerWeeklyReports() {
    logger.info('Manually triggering weekly reports');
    return this.sendWeeklyReports();
  }

  /**
   * Manually trigger daily summaries
   */
  async triggerDailySummaries() {
    logger.info('Manually triggering daily summaries');
    return this.sendDailySummaries();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.scheduledJobs.keys()),
      nextRuns: {}
    };
  }
}

module.exports = new EmailScheduler();