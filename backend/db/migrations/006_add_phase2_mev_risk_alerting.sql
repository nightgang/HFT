-- Migration: Add Phase 2 Tables for MEV, Risk Limits, and Alerting

-- Create risk_violations table for tracking risk breaches
CREATE TABLE IF NOT EXISTS risk_violations (
    violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(trade_id) ON DELETE SET NULL,
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'high',
    details JSONB,
    resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_violations_wallet ON risk_violations(wallet_id);
CREATE INDEX IF NOT EXISTS idx_risk_violations_type ON risk_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_risk_violations_created_at ON risk_violations(created_at DESC);

-- Create portfolio_correlations table for correlation analysis
CREATE TABLE IF NOT EXISTS portfolio_correlations (
    correlation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    token_1 VARCHAR(255) NOT NULL,
    token_2 VARCHAR(255) NOT NULL,
    correlation NUMERIC(5, 4),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_correlations_wallet ON portfolio_correlations(wallet_id);
CREATE INDEX IF NOT EXISTS idx_correlations_value ON portfolio_correlations(correlation DESC);

-- Create mev_execution_log table for tracking MEV protection
CREATE TABLE IF NOT EXISTS mev_execution_log (
    mev_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE,
    mev_risk_score INTEGER,
    execution_method VARCHAR(50), -- direct, bundle, private_rpc
    priority_fee_microlamports INTEGER,
    bundle_id VARCHAR(255),
    bundle_status VARCHAR(50), -- pending, submitted, confirmed, failed
    mev_saved_usd NUMERIC(18, 2),
    sandwich_detected BOOLEAN DEFAULT false,
    execution_price NUMERIC(18, 8),
    expected_price NUMERIC(18, 8),
    actual_slippage_bps INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mev_log_trade ON mev_execution_log(trade_id);
CREATE INDEX IF NOT EXISTS idx_mev_log_method ON mev_execution_log(execution_method);
CREATE INDEX IF NOT EXISTS idx_mev_log_created_at ON mev_execution_log(created_at DESC);

-- Create alerts table for alerting system
CREATE TABLE IF NOT EXISTS alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
    details JSONB,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_wallet_id ON alerts(wallet_id);

-- Create sla_metrics table for SLA tracking
CREATE TABLE IF NOT EXISTS sla_metrics (
    sla_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    target_value NUMERIC(12, 2),
    actual_value NUMERIC(12, 2),
    status VARCHAR(50), -- met, missed, warning
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sla_metric_name ON sla_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_sla_created_at ON sla_metrics(created_at DESC);

-- Create incident_reports table for automated incident tracking
CREATE TABLE IF NOT EXISTS incident_reports (
    incident_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    root_cause TEXT,
    remediation TEXT,
    status VARCHAR(50), -- open, investigating, resolved
    impact_usd NUMERIC(18, 2),
    affected_wallets INT DEFAULT 0,
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_incidents_type ON incident_reports(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incident_reports(start_time DESC);

-- Create transaction_cost_analysis table
CREATE TABLE IF NOT EXISTS transaction_cost_analysis (
    cost_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    base_fee_lamports INTEGER,
    priority_fee_lamports INTEGER,
    total_fee_usd NUMERIC(18, 8),
    mev_impact_usd NUMERIC(18, 8),
    slippage_usd NUMERIC(18, 8),
    total_cost_usd NUMERIC(18, 8),
    efficiency_rating NUMERIC(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cost_analysis_trade ON transaction_cost_analysis(trade_id);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_wallet ON transaction_cost_analysis(wallet_id);

-- Record migration
INSERT INTO schema_migrations (migration_name, success)
VALUES ('005_add_phase2_mev_risk_alerting', true)
ON CONFLICT DO NOTHING;
