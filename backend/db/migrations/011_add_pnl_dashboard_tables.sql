-- Migration: Add P&L Snapshots and Dashboard Tables

-- ============================================================================
-- P&L SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pnl_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,

    -- P&L Values
    realized_pnl_usd NUMERIC(18, 2) DEFAULT 0,
    unrealized_pnl_usd NUMERIC(18, 2) DEFAULT 0,
    total_pnl_usd NUMERIC(18, 2) DEFAULT 0,

    -- P&L Percentages
    realized_pnl_percent NUMERIC(8, 4) DEFAULT 0,
    unrealized_pnl_percent NUMERIC(8, 4) DEFAULT 0,

    -- Portfolio Values
    total_portfolio_value_usd NUMERIC(18, 2) DEFAULT 0,
    total_invested_usd NUMERIC(18, 2) DEFAULT 0,

    -- Performance Metrics
    daily_return_percent NUMERIC(8, 4) DEFAULT 0,
    weekly_return_percent NUMERIC(8, 4) DEFAULT 0,
    monthly_return_percent NUMERIC(8, 4) DEFAULT 0,
    sharpe_ratio NUMERIC(8, 4) DEFAULT 0,
    max_drawdown_percent NUMERIC(8, 4) DEFAULT 0,

    -- Risk Metrics
    volatility_percent NUMERIC(8, 4) DEFAULT 0,
    beta NUMERIC(8, 4) DEFAULT 0,
    alpha NUMERIC(8, 4) DEFAULT 0,

    -- Metadata
    snapshot_date DATE DEFAULT CURRENT_DATE,
    snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_wallet ON pnl_snapshots(wallet_id);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_date ON pnl_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_created_at ON pnl_snapshots(created_at DESC);

-- ============================================================================
-- DASHBOARD METRICS CACHE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dashboard_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL, -- 'pnl', 'performance', 'risk', 'portfolio'

    -- Metric Data
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(18, 8),
    metric_unit VARCHAR(50),
    metric_category VARCHAR(100),

    -- Time Series
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    period_start TIMESTAMP,
    period_end TIMESTAMP,

    -- Metadata
    metadata JSONB,
    tags JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_wallet ON dashboard_metrics(wallet_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_type ON dashboard_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_name ON dashboard_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_recorded_at ON dashboard_metrics(recorded_at DESC);

-- ============================================================================
-- REAL-TIME ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS realtime_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- 'pnl_threshold', 'drawdown', 'performance', 'risk'

    -- Alert Details
    title VARCHAR(255) NOT NULL,
    message TEXT,
    severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

    -- Thresholds
    threshold_value NUMERIC(18, 8),
    current_value NUMERIC(18, 8),
    threshold_operator VARCHAR(20), -- 'gt', 'lt', 'gte', 'lte', 'eq'

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'triggered', 'acknowledged', 'resolved'
    triggered_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,

    -- Auto-actions
    auto_action VARCHAR(100), -- 'pause_trading', 'reduce_position', 'notify', 'none'
    auto_action_executed BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_realtime_alerts_wallet ON realtime_alerts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_realtime_alerts_type ON realtime_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_realtime_alerts_status ON realtime_alerts(status);
CREATE INDEX IF NOT EXISTS idx_realtime_alerts_severity ON realtime_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_realtime_alerts_triggered_at ON realtime_alerts(triggered_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_realtime_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER realtime_alerts_update_timestamp
BEFORE UPDATE ON realtime_alerts
FOR EACH ROW
EXECUTE FUNCTION update_realtime_alerts_timestamp();

-- Record migration
INSERT INTO schema_migrations (migration_name, success)
VALUES ('008_add_pnl_dashboard_tables', true)
ON CONFLICT DO NOTHING;