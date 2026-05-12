-- Migration: 004_risk_management
-- Created: 2024-01-01T00:03:00.000Z
-- Description: Create risk management and compliance tables

-- ============================================================================
-- RISK ENGINE & COMPLIANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_violations (
    violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(trade_id) ON DELETE SET NULL,
    violation_type risk_violation_type NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'warning', 'critical'

    -- Violation Details
    limit_value NUMERIC(18, 2),
    actual_value NUMERIC(18, 2),
    threshold_percent NUMERIC(8, 4),

    -- Blocked Token Tracking
    blocked_token_mint VARCHAR(255),
    blocked_token_symbol VARCHAR(20),
    reason TEXT,

    -- Recovery & Rules
    is_recoverable BOOLEAN DEFAULT false,
    recovery_time TIMESTAMP,
    rule_id VARCHAR(255), -- Link to risk rule

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_violations ON risk_violations(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violation_type ON risk_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_severity ON risk_violations(severity);
CREATE INDEX IF NOT EXISTS idx_resolved ON risk_violations(resolved_at);
CREATE INDEX IF NOT EXISTS idx_violation_created_at ON risk_violations(created_at DESC);

CREATE TABLE IF NOT EXISTS risk_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- 'daily_loss_limit', 'position_size', 'exposure', etc

    -- Rule Configuration
    is_global BOOLEAN DEFAULT false, -- Applies to all wallets
    enabled BOOLEAN DEFAULT true,
    threshold_value NUMERIC(18, 2) NOT NULL,
    threshold_unit VARCHAR(50), -- 'USD', 'percent', 'SOL'
    cooldown_period_seconds INT DEFAULT 0,

    -- Actions
    action_type VARCHAR(100), -- 'block', 'warn', 'reduce'
    max_recovery_attempts INT DEFAULT 3,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_rules ON risk_rules(wallet_id);
CREATE INDEX IF NOT EXISTS idx_global_rules ON risk_rules(is_global);
CREATE INDEX IF NOT EXISTS idx_enabled_rules ON risk_rules(enabled);

CREATE TABLE IF NOT EXISTS blocked_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_mint VARCHAR(255) UNIQUE NOT NULL,
    token_symbol VARCHAR(20),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255) NOT NULL,
    is_permanent BOOLEAN DEFAULT true,
    unblock_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_token_mint ON blocked_tokens(token_mint);
CREATE INDEX IF NOT EXISTS idx_is_permanent ON blocked_tokens(is_permanent);