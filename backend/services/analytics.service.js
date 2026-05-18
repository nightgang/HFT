// Analytics and Reporting Service
const logger = require('../utils/logger');
const { query } = require('../db/connection');
const nodemailer = require('nodemailer');

class AnalyticsService {
  constructor() {
    this.transporter = null;
    this.emailFrom = process.env.EMAIL_FROM || 'noreply@hftrading.com';
  }

  async initialize() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD
        }
      });
      logger.info('Analytics Service initialized with email support');
    } else {
      logger.warn('Email not configured for analytics reports');
    }
  }

  // Generate weekly performance report
  async generateWeeklyReport(walletId) {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const trades = await query(`
        SELECT * FROM trades
        WHERE wallet_id = $1
        AND executed_at >= $2
        ORDER BY executed_at DESC
      `, [walletId, startOfWeek]);

      const stats = await this.calculatePerformanceStats(trades.rows);
      const wallet = await query('SELECT * FROM wallets WHERE wallet_id = $1', [walletId]);

      const report = {
        report_type: 'weekly',
        wallet_id: walletId,
        wallet_address: wallet.rows[0]?.wallet_address,
        period_start: startOfWeek.toISOString(),
        period_end: new Date().toISOString(),
        statistics: stats,
        trades: trades.rows,
        generated_at: new Date().toISOString()
      };

      logger.info(`Weekly report generated for wallet ${walletId}:`, stats);
      return report;
    } catch (error) {
      logger.error('Failed to generate weekly report:', error);
      throw error;
    }
  }

  // Calculate performance statistics
  async calculatePerformanceStats(trades) {
    try {
      const totalTrades = trades.length;
      const successfulTrades = trades.filter(t => t.status === 'completed').length;
      const failedTrades = trades.filter(t => t.status === 'failed').length;

      const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.pnl_usd) || 0), 0);
      const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;
      const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

      // Calculate ROI
      const totalInvested = trades.reduce((sum, t) => sum + (parseFloat(t.size_usd) || 0), 0);
      const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

      // Find best and worst trades
      const sortedByPnL = [...trades].sort((a, b) => 
        (parseFloat(b.pnl_usd) || 0) - (parseFloat(a.pnl_usd) || 0)
      );

      return {
        total_trades: totalTrades,
        successful_trades: successfulTrades,
        failed_trades: failedTrades,
        success_rate_percent: parseFloat((successfulTrades / totalTrades * 100).toFixed(2)),
        total_pnl_usd: parseFloat(totalPnL.toFixed(2)),
        avg_pnl_usd: parseFloat(avgPnL.toFixed(2)),
        win_rate_percent: parseFloat(winRate.toFixed(2)),
        roi_percent: parseFloat(roi.toFixed(2)),
        best_trade: sortedByPnL[0] ? {
          trade_id: sortedByPnL[0].trade_id,
          pnl: parseFloat(sortedByPnL[0].pnl_usd),
          token: sortedByPnL[0].token_out
        } : null,
        worst_trade: sortedByPnL[sortedByPnL.length - 1] ? {
          trade_id: sortedByPnL[sortedByPnL.length - 1].trade_id,
          pnl: parseFloat(sortedByPnL[sortedByPnL.length - 1].pnl_usd),
          token: sortedByPnL[sortedByPnL.length - 1].token_out
        } : null
      };
    } catch (error) {
      logger.error('Failed to calculate stats:', error);
      return {};
    }
  }

  // Send weekly report email
  async sendWeeklyReport(walletId, recipientEmail) {
    try {
      if (!this.transporter) {
        logger.warn('Email not configured, skipping report send');
        return { sent: false, reason: 'Email not configured' };
      }

      const report = await this.generateWeeklyReport(walletId);

      const htmlContent = `
        <h2>Weekly Performance Report</h2>
        <p><strong>Period:</strong> ${report.period_start} to ${report.period_end}</p>
        <h3>Summary</h3>
        <table style="border-collapse: collapse;">
          <tr><td>Total Trades:</td><td><strong>${report.statistics.total_trades}</strong></td></tr>
          <tr><td>Successful:</td><td><strong>${report.statistics.successful_trades}</strong></td></tr>
          <tr><td>Success Rate:</td><td><strong>${report.statistics.success_rate_percent}%</strong></td></tr>
          <tr><td>Total P&L:</td><td><strong style="color: ${report.statistics.total_pnl_usd >= 0 ? 'green' : 'red'}">$${report.statistics.total_pnl_usd}</strong></td></tr>
          <tr><td>ROI:</td><td><strong>${report.statistics.roi_percent}%</strong></td></tr>
          <tr><td>Win Rate:</td><td><strong>${report.statistics.win_rate_percent}%</strong></td></tr>
        </table>
        <h3>Top Trades</h3>
        ${report.statistics.best_trade ? `
          <p><strong>Best Trade:</strong> ${report.statistics.best_trade.pnl > 0 ? '+' : ''}$${report.statistics.best_trade.pnl}</p>
        ` : ''}
        ${report.statistics.worst_trade ? `
          <p><strong>Worst Trade:</strong> ${report.statistics.worst_trade.pnl > 0 ? '+' : ''}$${report.statistics.worst_trade.pnl}</p>
        ` : ''}
      `;

      await this.transporter.sendMail({
        from: this.emailFrom,
        to: recipientEmail,
        subject: `HFT Trading Report - ${new Date().toLocaleDateString()}`,
        html: htmlContent
      });

      logger.info(`Weekly report sent to ${recipientEmail}`);
      return { sent: true, report_id: walletId };
    } catch (error) {
      logger.error('Failed to send weekly report:', error);
      return { sent: false, error: error.message };
    }
  }

  // Get P&L analytics
  async getPnLAnalytics(walletId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const result = await query(`
        SELECT 
          DATE(executed_at) as date,
          SUM(pnl_usd) as daily_pnl,
          COUNT(*) as trade_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_trades
        FROM trades
        WHERE wallet_id = $1
        AND executed_at >= $2
        GROUP BY DATE(executed_at)
        ORDER BY date DESC
      `, [walletId, startDate]);

      return {
        wallet_id: walletId,
        period_days: daysBack,
        daily_pnl: result.rows,
        cumulative_pnl: result.rows.reduce((sum, row) => sum + (parseFloat(row.daily_pnl) || 0), 0),
        total_trades: result.rows.reduce((sum, row) => sum + parseInt(row.trade_count), 0)
      };
    } catch (error) {
      logger.error('Failed to get P&L analytics:', error);
      return { error: error.message };
    }
  }

  // Get win rate tracking
  async getWinRateTracking(walletId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const result = await query(`
        SELECT 
          DATE(executed_at) as date,
          COUNT(*) as total_trades,
          COUNT(CASE WHEN pnl_usd > 0 THEN 1 END) as winning_trades,
          AVG(pnl_usd) as avg_pnl,
          MAX(pnl_usd) as max_win,
          MIN(pnl_usd) as max_loss
        FROM trades
        WHERE wallet_id = $1
        AND executed_at >= $2
        AND status = 'completed'
        GROUP BY DATE(executed_at)
        ORDER BY date DESC
      `, [walletId, startDate]);

      const formattedData = result.rows.map(row => ({
        date: row.date,
        total_trades: parseInt(row.total_trades),
        winning_trades: parseInt(row.winning_trades),
        win_rate_percent: row.total_trades > 0 ? 
          parseFloat((row.winning_trades / row.total_trades * 100).toFixed(2)) : 0,
        avg_pnl: parseFloat(row.avg_pnl),
        max_win: parseFloat(row.max_win),
        max_loss: parseFloat(row.max_loss)
      }));

      return {
        wallet_id: walletId,
        period_days: daysBack,
        daily_metrics: formattedData,
        overall_win_rate: formattedData.length > 0 ?
          parseFloat((formattedData.reduce((sum, d) => sum + d.win_rate_percent, 0) / formattedData.length).toFixed(2)) : 0
      };
    } catch (error) {
      logger.error('Failed to get win rate tracking:', error);
      return { error: error.message };
    }
  }

  // Get trading activity heatmap
  async getTradingActivityHeatmap(walletId, daysBack = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const result = await query(`
        SELECT 
          DATE_PART('dow', executed_at) as day_of_week,
          DATE_PART('hour', executed_at) as hour_of_day,
          COUNT(*) as trade_count,
          SUM(pnl_usd) as total_pnl,
          AVG(pnl_usd) as avg_pnl
        FROM trades
        WHERE wallet_id = $1
        AND executed_at >= $2
        GROUP BY day_of_week, hour_of_day
      `, [walletId, startDate]);

      // Convert to heatmap format
      const heatmap = {};
      result.rows.forEach(row => {
        const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(row.day_of_week)];
        const hour = `${String(parseInt(row.hour_of_day)).padStart(2, '0')}:00`;
        const key = `${day} ${hour}`;

        heatmap[key] = {
          trade_count: parseInt(row.trade_count),
          total_pnl: parseFloat(row.total_pnl),
          avg_pnl: parseFloat(row.avg_pnl)
        };
      });

      return {
        wallet_id: walletId,
        period_days: daysBack,
        heatmap_data: heatmap
      };
    } catch (error) {
      logger.error('Failed to generate heatmap:', error);
      return { error: error.message };
    }
  }

  // Export dashboard data
  async exportDashboardData(walletId) {
    try {
      const pnl = await this.getPnLAnalytics(walletId, 90);
      const winRate = await this.getWinRateTracking(walletId, 90);
      const heatmap = await this.getTradingActivityHeatmap(walletId, 90);
      const weekly = await this.generateWeeklyReport(walletId);

      return {
        export_date: new Date().toISOString(),
        wallet_id: walletId,
        pnl_analytics: pnl,
        win_rate_tracking: winRate,
        activity_heatmap: heatmap,
        weekly_report: weekly.statistics
      };
    } catch (error) {
      logger.error('Failed to export dashboard data:', error);
      return { error: error.message };
    }
  }
}

module.exports = new AnalyticsService();
