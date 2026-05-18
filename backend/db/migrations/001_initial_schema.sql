-- Migration: Initial schema setup
-- Run this after creating the database

-- Create custom types
DO $$ BEGIN
    CREATE TYPE trade_status AS ENUM ('pending', 'active', 'executing', 'executed', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trade_direction AS ENUM ('buy', 'sell');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_violation_type AS ENUM ('daily_loss_limit', 'position_size', 'blacklist', 'exposure_limit', 'cooldown_violation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create schema_migrations table first
CREATE TABLE IF NOT EXISTS schema_migrations (
    migration_id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Core Schema for HFT Trading System
-- Persistence Layer: Trade History, Wallet State, Risk Logs, Audit Trail

-- ============================================================================
-- WALLETS & ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallets (
    wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(255) UNIQUE NOT NULL,
    wallet_name VARCHAR(255),
    wallet_type VARCHAR(50) DEFAULT 'standard',
    multisig_signers JSONB,
    multisig_threshold INT,
    multisig_address VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    encrypted_private_key TEXT, -- Encrypted with libsodium
    key_derivation_path VARCHAR(255), -- BIP44 path
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_wallet_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_active_wallets ON wallets(is_active);

CREATE TABLE IF NOT EXISTS wallet_balances (
    balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    balance NUMERIC(38, 8) NOT NULL DEFAULT 0,
    reserved_balance NUMERIC(38, 8) DEFAULT 0, -- Locked for pending trades
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_id, token_mint)
);

CREATE INDEX IF NOT EXISTS idx_wallet_token ON wallet_balances(wallet_id, token_mint);
CREATE INDEX IF NOT EXISTS idx_recorded_at ON wallet_balances(recorded_at);

CREATE TABLE IF NOT EXISTS wallet_performance (
    performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    total_trades INT DEFAULT 0,
    successful_trades INT DEFAULT 0,
    failed_trades INT DEFAULT 0,
    total_pnl NUMERIC(38, 8) DEFAULT 0,
    roi_percent NUMERIC(8, 4) DEFAULT 0,
    win_rate_percent NUMERIC(5, 2) DEFAULT 0,
    last_trade_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_performance ON wallet_performance(wallet_id);

-- ============================================================================
-- TRADING HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS trades (
    trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    strategy_type VARCHAR(50) NOT NULL, -- 'arbitrage', 'sniper', 'smartmoney', 'trading'
    request_id VARCHAR(255) UNIQUE, -- External request tracking
    status trade_status DEFAULT 'pending',
    direction trade_direction NOT NULL,
    
    -- Input Token (what we're selling)
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8) NOT NULL,
    
    -- Output Token (what we're buying)
    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),
    expected_output_amount NUMERIC(38, 8),
    actual_output_amount NUMERIC(38, 8),
    
    -- Pricing & Costs
    expected_price NUMERIC(38, 8),
    actual_price NUMERIC(38, 8),
    slippage_percent NUMERIC(8, 4),
    transaction_fee NUMERIC(38, 8),
    priority_fee NUMERIC(38, 8),
    total_cost_usd NUMERIC(18, 2),
    
    -- Execution Details
    executed_at TIMESTAMP,
    settlement_at TIMESTAMP,
    tx_signature VARCHAR(255) UNIQUE,
    tx_confirmation_status transaction_status,
    rpc_endpoint VARCHAR(255),
    
    -- Profit/Loss
    pnl_usd NUMERIC(18, 2),
    pnl_percent NUMERIC(8, 4),
    
    -- Metadata
    notes TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_trades ON trades(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tx_signature ON trades(tx_signature);
CREATE INDEX IF NOT EXISTS idx_strategy_type ON trades(strategy_type);
CREATE INDEX IF NOT EXISTS idx_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_executed_at ON trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_created_at ON trades(created_at DESC);

CREATE TABLE IF NOT EXISTS trade_details (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE,
    route_path TEXT, -- JSON array of token swaps
    liquidity_provider VARCHAR(255), -- 'jupiter', 'raydium', etc
    impact_percent NUMERIC(8, 4),
    min_output_amount NUMERIC(38, 8),
    max_slippage_percent NUMERIC(8, 4),
    timeout_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_details ON trade_details(trade_id);

CREATE TABLE IF NOT EXISTS trade_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'initiated', 'simulated', 'submitted', 'confirmed', 'failed'
    event_data JSONB, -- Flexible event metadata
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_events ON trade_events(trade_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_type ON trade_events(event_type);

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

-- ============================================================================
-- MONITORING & HEALTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(18, 4) NOT NULL,
    unit VARCHAR(50),
    tags JSONB, -- Additional context
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metric_name ON system_metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recorded_at ON system_metrics(recorded_at);

CREATE TABLE IF NOT EXISTS health_checks (
    check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    latency_ms INT,
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_status ON health_checks(service_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_checked_at ON health_checks(checked_at DESC);

CREATE TABLE IF NOT EXISTS api_call_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_service VARCHAR(100) NOT NULL, -- 'jupiter', 'helius', 'rpc'
    endpoint VARCHAR(255),
    method VARCHAR(10),
    request_duration_ms INT,
    status_code INT,
    error_message TEXT,
    wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_service ON api_call_logs(api_service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_created_at ON api_call_logs(created_at DESC);

-- ============================================================================
-- WEBSOCKET & CONNECTION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS websocket_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    client_info JSONB, -- User agent, IP, etc
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    messages_sent INT DEFAULT 0,
    messages_received INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_sessions ON websocket_sessions(wallet_id, connected_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions ON websocket_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_last_activity ON websocket_sessions(last_activity);

-- ============================================================================
-- AUDIT TRAIL (IMMUTABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit.key_access_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL, -- Store without FK for audit integrity
    access_type VARCHAR(50) NOT NULL, -- 'decrypt', 'rotate', 'backup', 'restore'
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    status VARCHAR(20), -- 'success', 'failed'
    error_message TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Immutable: cannot update
);

CREATE INDEX IF NOT EXISTS idx_wallet_access ON audit.key_access_logs(wallet_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_type ON audit.key_access_logs(access_type);

CREATE TABLE IF NOT EXISTS audit.configuration_changes (
    change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100), -- 'wallet', 'rule', 'api_key'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entity_changes ON audit.configuration_changes(entity_type, entity_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS audit.error_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code VARCHAR(20),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    severity VARCHAR(20), -- 'info', 'warning', 'error', 'critical'
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_severity ON audit.error_logs(severity, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolved ON audit.error_logs(resolved);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_update_timestamp
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallet_timestamp();

-- Update trade timestamp
CREATE OR REPLACE FUNCTION update_trade_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trades_update_timestamp
BEFORE UPDATE ON trades
FOR EACH ROW
EXECUTE FUNCTION update_trade_timestamp();

-- Log trade events automatically
CREATE OR REPLACE FUNCTION log_trade_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO trade_events (trade_id, event_type, event_data)
    VALUES (
        NEW.trade_id,
        'status_change',
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'timestamp', CURRENT_TIMESTAMP
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trades_log_events
AFTER UPDATE ON trades
FOR EACH ROW
EXECUTE FUNCTION log_trade_event();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

CREATE OR REPLACE VIEW wallet_daily_pnl AS
SELECT
    w.wallet_id,
    w.wallet_address,
    DATE(t.executed_at) as trade_date,
    COUNT(*) as trade_count,
    SUM(CASE WHEN t.status = 'executed' THEN 1 ELSE 0 END) as successful_trades,
    SUM(COALESCE(t.pnl_usd, 0)) as daily_pnl,
    AVG(COALESCE(t.slippage_percent, 0)) as avg_slippage,
    SUM(COALESCE(t.transaction_fee, 0) + COALESCE(t.priority_fee, 0)) as total_fees
FROM wallets w
LEFT JOIN trades t ON w.wallet_id = t.wallet_id
WHERE t.created_at >= CURRENT_DATE
GROUP BY w.wallet_id, w.wallet_address, DATE(t.executed_at)
ORDER BY DATE(t.executed_at) DESC;

CREATE OR REPLACE VIEW active_violations AS
SELECT * FROM risk_violations
WHERE resolved_at IS NULL
ORDER BY created_at DESC;

CREATE OR REPLACE VIEW system_health AS
SELECT
    service_name,
    status,
    COUNT(*) as check_count,
    AVG(latency_ms) as avg_latency_ms,
    MAX(checked_at) as last_check
FROM health_checks
WHERE checked_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY service_name, status;

-- ============================================================================
-- GRANTS & PERMISSIONS
-- ============================================================================

-- Create application role (least privilege)
DO $$
BEGIN
    CREATE ROLE hft_app_role WITH LOGIN PASSWORD 'change_in_production';
EXCEPTION WHEN DUPLICATE_OBJECT THEN
    NULL;
END
$$;

-- Grant permissions
DO $$ BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO hft_app_role', current_database());
    EXECUTE format('GRANT USAGE ON SCHEMA public TO hft_app_role');
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO hft_app_role');
    EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA audit TO hft_app_role');
    EXECUTE format('GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO hft_app_role');
END $$;

-- Restrict audit schema
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO hft_app_role;
REVOKE INSERT, UPDATE, DELETE ON audit.key_access_logs FROM hft_app_role;
