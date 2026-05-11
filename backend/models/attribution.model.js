const { query } = require('../db/connection');
const logger = require('../utils/logger');

class PnLModel {
  // Record a P&L snapshot
  static async recordSnapshot(snapshotData) {
    const {
      wallet_id,
      realized_pnl_usd,
      unrealized_pnl_usd,
      total_pnl_usd,
      realized_pnl_percent,
      unrealized_pnl_percent,
      total_portfolio_value_usd,
      total_invested_usd,
      daily_return_percent,
      weekly_return_percent,
      monthly_return_percent,
      sharpe_ratio,
      max_drawdown_percent
    } = snapshotData;

    const sql = `
      INSERT INTO pnl_snapshots (
        wallet_id, realized_pnl_usd, unrealized_pnl_usd, total_pnl_usd,
        realized_pnl_percent, unrealized_pnl_percent, total_portfolio_value_usd,
        total_invested_usd, daily_return_percent, weekly_return_percent,
        monthly_return_percent, sharpe_ratio, max_drawdown_percent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      wallet_id, realized_pnl_usd, unrealized_pnl_usd, total_pnl_usd,
      realized_pnl_percent, unrealized_pnl_percent, total_portfolio_value_usd,
      total_invested_usd, daily_return_percent, weekly_return_percent,
      monthly_return_percent, sharpe_ratio, max_drawdown_percent
    ];

    try {
      const result = await query(sql, values);
      logger.info(`P&L snapshot recorded for wallet: ${wallet_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording P&L snapshot:', error);
      throw error;
    }
  }

  // Get latest P&L snapshot for a wallet
  static async getLatestSnapshot(wallet_id) {
    const sql = `
      SELECT * FROM pnl_snapshots
      WHERE wallet_id = $1
      ORDER BY recorded_at DESC
      LIMIT 1
    `;
    try {
      const result = await query(sql, [wallet_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching latest P&L snapshot:', error);
      throw error;
    }
  }

  // Get P&L history for a wallet within time range
  static async getSnapshotHistory(wallet_id, startDate, endDate) {
    const sql = `
      SELECT * FROM pnl_snapshots
      WHERE wallet_id = $1
      AND recorded_at >= $2
      AND recorded_at <= $3
      ORDER BY recorded_at ASC
    `;
    try {
      const result = await query(sql, [wallet_id, startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching P&L history:', error);
      throw error;
    }
  }

  // Get snapshots for dashboard (last 24 hours, 7 days, 30 days)
  static async getDashboardSnapshots(wallet_id) {
    const sql = `
      SELECT
        'latest' AS period, * FROM pnl_snapshots WHERE wallet_id = $1 ORDER BY recorded_at DESC LIMIT 1
      UNION ALL
      SELECT '24h' AS period, * FROM pnl_snapshots WHERE wallet_id = $1 AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours' ORDER BY recorded_at DESC LIMIT 1
      UNION ALL
      SELECT '7d' AS period, * FROM pnl_snapshots WHERE wallet_id = $1 AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' ORDER BY recorded_at ASC LIMIT 1
      UNION ALL
      SELECT '30d' AS period, * FROM pnl_snapshots WHERE wallet_id = $1 AND recorded_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' ORDER BY recorded_at ASC LIMIT 1
    `;
    try {
      const result = await query(sql, [wallet_id]);
      const snapshots = {};
      result.rows.forEach(row => {
        snapshots[row.period] = row;
      });
      return snapshots;
    } catch (error) {
      logger.error('Error fetching dashboard snapshots:', error);
      throw error;
    }
  }
}

class PerformanceAttributionModel {
  // Record strategy performance attribution
  static async recordPerformanceAttribution(attributionData) {
    const {
      wallet_id,
      period_start,
      period_end,
      total_return_percent,
      benchmark_return_percent,
      excess_return_percent,
      strategy_contribution,
      asset_contribution,
      timing_contribution,
      volatility_contribution,
      max_drawdown_contribution,
      metadata
    } = attributionData;

    const sql = `
      INSERT INTO performance_attribution (
        wallet_id, period_start, period_end, total_return_percent,
        benchmark_return_percent, excess_return_percent, strategy_contribution,
        asset_contribution, timing_contribution, volatility_contribution,
        max_drawdown_contribution, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      wallet_id, period_start, period_end, total_return_percent,
      benchmark_return_percent, excess_return_percent, JSON.stringify(strategy_contribution),
      JSON.stringify(asset_contribution), JSON.stringify(timing_contribution),
      volatility_contribution, max_drawdown_contribution, metadata
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Performance attribution recorded for wallet: ${wallet_id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording performance attribution:', error);
      throw error;
    }
  }

  // Get performance attribution for wallet
  static async getPerformanceAttribution(wallet_id, period_start, period_end) {
    const sql = `
      SELECT * FROM performance_attribution
      WHERE wallet_id = $1
      AND period_start >= $2
      AND period_end <= $3
      ORDER BY created_at DESC
    `;
    try {
      const result = await query(sql, [wallet_id, period_start, period_end]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching performance attribution:', error);
      throw error;
    }
  }
}

class TokenAttributionModel {
  // Record token attribution
  static async recordAttribution(attributionData) {
    const {
      wallet_id,
      token_mint,
      token_symbol,
      total_trades,
      token_pnl_usd,
      token_pnl_percent,
      current_holdings,
      avg_entry_price,
      current_price,
      period_start,
      period_end
    } = attributionData;

    const sql = `
      INSERT INTO token_attribution (
        wallet_id, token_mint, token_symbol, total_trades,
        token_pnl_usd, token_pnl_percent, current_holdings,
        avg_entry_price, current_price, period_start, period_end
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      wallet_id, token_mint, token_symbol, total_trades,
      token_pnl_usd, token_pnl_percent, current_holdings,
      avg_entry_price, current_price, period_start, period_end
    ];

    try {
      const result = await query(sql, values);
      logger.info(`Token attribution recorded: ${token_symbol}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error recording token attribution:', error);
      throw error;
    }
  }

  // Get token attribution for wallet
  static async getTokenAttribution(wallet_id, period_start, period_end) {
    const sql = `
      SELECT * FROM token_attribution
      WHERE wallet_id = $1
      AND period_start >= $2
      AND period_end <= $3
      ORDER BY token_pnl_usd DESC
    `;
    try {
      const result = await query(sql, [wallet_id, period_start, period_end]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching token attribution:', error);
      throw error;
    }
  }
}

module.exports = { PnLModel, PerformanceAttributionModel, TokenAttributionModel };
