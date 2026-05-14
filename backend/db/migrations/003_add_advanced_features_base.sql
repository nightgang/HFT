-- ============================================================================
-- ADVANCED TRADING FEATURES MIGRATION
-- ============================================================================

-- ============================================================================
-- 1. ADVANCED ORDERS (Stop-Loss, Take-Profit, Conditional Orders)
-- ============================================================================

CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop_loss', 'take_profit', 'conditional');
CREATE TYPE order_condition AS ENUM ('price_above', 'price_below', 'price_between', 'volatility_above', 'time_based');

CREATE TABLE IF NOT EXISTS advanced_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    order_type order_type NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    
    -- Token details
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8) NOT NULL,
    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),
    
    -- Order specifications
    trigger_price NUMERIC(38, 8),
    limit_price NUMERIC(38, 8),
    stop_loss_price NUMERIC(38, 8),
    take_profit_price NUMERIC(38, 8),
    
    -- Conditions
    condition_type order_condition,
    condition_value NUMERIC(38, 8),
    condition_metadata JSONB,
    
    -- Time-based triggers
    execute_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Execution details
    is_executed BOOLEAN DEFAULT false,
    executed_at TIMESTAMP,
    executed_price NUMERIC(38, 8),
    execution_tx_signature VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Add is_active column if missing (for backward compatibility)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'advanced_orders' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE advanced_orders ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_advanced_orders_wallet ON advanced_orders(wallet_id);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_status ON advanced_orders(status, wallet_id);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_triggers ON advanced_orders(trigger_price, expires_at) WHERE status = 'active';

-- ============================================================================
-- 2. LIQUIDITY POOL MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS liquidity_pools (
    pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_address VARCHAR(255) UNIQUE NOT NULL,
    token_a_mint VARCHAR(255) NOT NULL,
    token_a_symbol VARCHAR(20),
    token_b_mint VARCHAR(255) NOT NULL,
    token_b_symbol VARCHAR(20),
    
    -- Pool metrics
    total_liquidity_usd NUMERIC(18, 2),
    token_a_reserves NUMERIC(38, 8),
    token_b_reserves NUMERIC(38, 8),
    fee_tier NUMERIC(8, 4), -- 0.01%, 0.05%, 0.30%, 1.00%
    
    -- Pool details
    pool_program VARCHAR(255), -- Raydium, Orca, etc.
    is_active BOOLEAN DEFAULT true,
    created_on_chain TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liquidity_pools_tokens ON liquidity_pools(token_a_mint, token_b_mint);

-- Create index on is_active only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'liquidity_pools' AND column_name = 'is_active'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_liquidity_pools_active ON liquidity_pools(is_active);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS liquidity_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id UUID NOT NULL REFERENCES liquidity_pools(pool_id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Position details
    lp_token_mint VARCHAR(255) NOT NULL,
    lp_token_balance NUMERIC(38, 8) NOT NULL,
    
    -- Share metrics
    pool_share_percent NUMERIC(8, 4),
    token_a_contributed NUMERIC(38, 8),
    token_b_contributed NUMERIC(38, 8),
    
    -- Yield metrics
    unclaimed_fees NUMERIC(38, 8) DEFAULT 0,
    total_fees_earned NUMERIC(38, 8) DEFAULT 0,
    fee_yielded_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liquidity_positions_wallet ON liquidity_positions(wallet_id, pool_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_active ON liquidity_positions(is_active);

-- ============================================================================
-- 3. LIMIT ORDER BOOK
-- ============================================================================

CREATE TABLE IF NOT EXISTS limit_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Order details
    side trade_direction NOT NULL,
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8) NOT NULL,
    
    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),
    limit_price NUMERIC(38, 8) NOT NULL,
    
    -- Execution tracking
    filled_amount NUMERIC(38, 8) DEFAULT 0,
    remaining_amount NUMERIC(38, 8),
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, partially_filled, filled, cancelled
    is_post_only BOOLEAN DEFAULT false,
    is_ioc BOOLEAN DEFAULT false, -- Immediate Or Cancel
    
    -- Time management
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filled_at TIMESTAMP,
    
    -- Execution metadata
    execution_tx_signatures TEXT[], -- Array of transaction signatures
    average_fill_price NUMERIC(38, 8)
);

CREATE INDEX IF NOT EXISTS idx_limit_orders_wallet ON limit_orders(wallet_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status, wallet_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_active ON limit_orders(created_at DESC) WHERE status IN ('open', 'partially_filled');

-- ============================================================================
-- 4. REAL-TIME P&L DASHBOARD
-- ============================================================================

CREATE TABLE IF NOT EXISTS pnl_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- P&L metrics
    realized_pnl_usd NUMERIC(18, 2),
    unrealized_pnl_usd NUMERIC(18, 2),
    total_pnl_usd NUMERIC(18, 2),
    
    -- Percentage metrics
    realized_pnl_percent NUMERIC(8, 4),
    unrealized_pnl_percent NUMERIC(8, 4),
    
    -- Portfolio metrics
    total_portfolio_value_usd NUMERIC(18, 2),
    total_invested_usd NUMERIC(18, 2),
    
    -- Performance
    daily_return_percent NUMERIC(8, 4),
    weekly_return_percent NUMERIC(8, 4),
    monthly_return_percent NUMERIC(8, 4),
    
    -- Risk metrics
    sharpe_ratio NUMERIC(8, 4),
    max_drawdown_percent NUMERIC(8, 4),
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_wallet_time ON pnl_snapshots(wallet_id, recorded_at DESC);

-- ============================================================================
-- 5. PERFORMANCE ATTRIBUTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS strategy_performance (
    attribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    strategy_name VARCHAR(100) NOT NULL,
    
    -- Performance metrics
    total_trades INT DEFAULT 0,
    winning_trades INT DEFAULT 0,
    losing_trades INT DEFAULT 0,
    
    -- P&L by strategy
    strategy_pnl_usd NUMERIC(18, 2),
    strategy_pnl_percent NUMERIC(8, 4),
    
    -- Win/Loss metrics
    win_rate_percent NUMERIC(5, 2),
    avg_win_usd NUMERIC(18, 2),
    avg_loss_usd NUMERIC(18, 2),
    profit_factor NUMERIC(8, 4),
    
    -- Time period
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_strategy_performance_wallet ON strategy_performance(wallet_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_period ON strategy_performance(wallet_id, period_start, period_end);

CREATE TABLE IF NOT EXISTS token_attribution (
    attribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    
    -- Token-specific metrics
    total_trades INT DEFAULT 0,
    token_pnl_usd NUMERIC(18, 2),
    token_pnl_percent NUMERIC(8, 4),
    
    -- Holdings
    current_holdings NUMERIC(38, 8),
    avg_entry_price NUMERIC(38, 8),
    current_price NUMERIC(38, 8),
    
    -- Period
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_attribution_wallet ON token_attribution(wallet_id, token_mint);

-- ============================================================================
-- 6. RISK HEATMAP & CORRELATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS position_concentration (
    concentration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Concentration metrics
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    position_size_usd NUMERIC(18, 2),
    portfolio_weight_percent NUMERIC(8, 4),
    
    -- Risk assessment
    concentration_score NUMERIC(8, 4), -- 0-100 scale
    is_overconcentrated BOOLEAN DEFAULT false,
    risk_level VARCHAR(50), -- 'low', 'medium', 'high'
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_position_concentration_wallet ON position_concentration(wallet_id);

CREATE TABLE IF NOT EXISTS correlation_matrix (
    correlation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Token pair correlation
    token_a_mint VARCHAR(255) NOT NULL,
    token_a_symbol VARCHAR(20),
    token_b_mint VARCHAR(255) NOT NULL,
    token_b_symbol VARCHAR(20),
    
    -- Correlation metrics
    correlation_coefficient NUMERIC(6, 4), -- -1 to 1
    correlation_strength VARCHAR(50), -- 'weak', 'moderate', 'strong'
    
    -- Period
    period_days INT, -- 7, 30, 90 days
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_correlation_matrix_wallet ON correlation_matrix(wallet_id);

-- ============================================================================
-- 7. PREDICTIVE ALERTS & ANOMALIES
-- ============================================================================

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_type AS ENUM ('price_movement', 'volatility_spike', 'failure_pattern', 'liquidation_risk', 'gas_price_spike', 'slippage_warning');

CREATE TABLE IF NOT EXISTS predictive_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Alert details
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    
    -- Anomaly context
    detected_pattern VARCHAR(255),
    confidence_score NUMERIC(5, 2), -- 0-100%
    
    -- Token context
    token_mint VARCHAR(255),
    token_symbol VARCHAR(20),
    
    -- Alert message
    message TEXT,
    recommendation TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, resolved
    acknowledged_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictive_alerts_wallet ON predictive_alerts(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_severity ON predictive_alerts(severity) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS anomaly_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Anomaly detection
    anomaly_type VARCHAR(100),
    metric_name VARCHAR(100),
    metric_value NUMERIC(20, 8),
    expected_value NUMERIC(20, 8),
    deviation_percent NUMERIC(8, 4),
    
    -- Detection metadata
    detection_algorithm VARCHAR(100),
    confidence_score NUMERIC(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anomaly_logs_wallet ON anomaly_logs(wallet_id, created_at DESC);

-- ============================================================================
-- 8. SOCIAL/SENTIMENT DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentiment_scores (
    sentiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    
    -- Sentiment metrics
    overall_sentiment NUMERIC(6, 4), -- -1 to 1 scale
    twitter_sentiment NUMERIC(6, 4),
    discord_sentiment NUMERIC(6, 4),
    reddit_sentiment NUMERIC(6, 4),
    
    -- Signal strength
    mention_count INT,
    influencer_mentions INT,
    
    -- Trend
    sentiment_trend VARCHAR(50), -- 'bullish', 'neutral', 'bearish'
    trend_velocity NUMERIC(6, 4),
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_sentiment_scores_token ON sentiment_scores(token_mint, recorded_at DESC);

CREATE TABLE IF NOT EXISTS social_signals (
    signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    
    -- Signal details
    signal_type VARCHAR(100), -- 'whale_movement', 'influencer_mention', 'community_spike'
    signal_strength NUMERIC(5, 2), -- 0-100 scale
    
    -- Source
    source_platform VARCHAR(50), -- 'twitter', 'discord', 'reddit', 'on_chain'
    source_account VARCHAR(255),
    
    -- Metadata
    signal_content TEXT,
    signal_link VARCHAR(500),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_signals_token ON social_signals(token_mint, created_at DESC);

-- ============================================================================
-- 9. CROSS-CHAIN BRIDGE TRANSACTIONS
-- ============================================================================

CREATE TYPE bridge_status AS ENUM ('initiated', 'locked', 'minted', 'confirmed', 'failed');
CREATE TYPE bridge_direction AS ENUM ('solana_to_ethereum', 'ethereum_to_solana', 'solana_to_polygon', 'polygon_to_solana', 'cross_solana');

CREATE TABLE IF NOT EXISTS cross_chain_transactions (
    bridge_tx_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Bridge details
    bridge_direction bridge_direction NOT NULL,
    bridge_program VARCHAR(255), -- Wormhole, Portal, etc.
    
    -- Source chain
    source_chain VARCHAR(50), -- 'solana', 'ethereum', 'polygon'
    source_tx_signature VARCHAR(255) UNIQUE,
    source_token_mint VARCHAR(255),
    source_token_symbol VARCHAR(20),
    source_amount NUMERIC(38, 8),
    
    -- Target chain
    target_chain VARCHAR(50),
    target_token_address VARCHAR(255),
    target_amount NUMERIC(38, 8),
    target_tx_signature VARCHAR(255),
    target_recipient_address VARCHAR(255),
    
    -- Bridge fees
    bridge_fee_usd NUMERIC(18, 2),
    gas_fee_usd NUMERIC(18, 2),
    
    -- Status
    status bridge_status DEFAULT 'initiated',
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    locked_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    failed_at TIMESTAMP,
    
    error_message TEXT,
    retry_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_wallet ON cross_chain_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_cross_chain_transactions_status ON cross_chain_transactions(status);

CREATE TABLE IF NOT EXISTS bridge_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bridge_tx_id UUID NOT NULL REFERENCES cross_chain_transactions(bridge_tx_id) ON DELETE CASCADE,
    
    -- Event tracking
    event_type VARCHAR(100), -- 'lock', 'mint', 'release', 'dispute'
    event_chain VARCHAR(50),
    event_tx_signature VARCHAR(255),
    
    -- Details
    event_data JSONB,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bridge_records_bridge_tx ON bridge_records(bridge_tx_id);

-- ============================================================================
-- 10. JITO BUNDLE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS jito_bundles (
    bundle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Bundle details
    bundle_uuid VARCHAR(255) UNIQUE,
    bundle_nonce BIGINT,
    
    -- Transactions
    transaction_count INT NOT NULL,
    tip_amount NUMERIC(38, 8),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, landed, dropped
    
    -- Metrics
    bundle_confirmation_status VARCHAR(50),
    landed_slot BIGINT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    landed_at TIMESTAMP,
    
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_jito_bundles_wallet ON jito_bundles(wallet_id);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_status ON jito_bundles(status);

-- ============================================================================
-- 11. TRADE HISTORY AGGREGATION & SEARCH
-- ============================================================================

CREATE TABLE IF NOT EXISTS trade_search_index (
    index_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE UNIQUE,
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    
    -- Searchable fields
    strategy_type VARCHAR(50),
    input_symbol VARCHAR(20),
    output_symbol VARCHAR(20),
    status VARCHAR(50),
    
    -- Full-text search
    search_vector tsvector,
    
    -- Time-based
    executed_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_search_wallet ON trade_search_index(wallet_id);
CREATE INDEX IF NOT EXISTS idx_trade_search_token ON trade_search_index(input_symbol, output_symbol);
CREATE INDEX IF NOT EXISTS idx_trade_search_date ON trade_search_index(executed_date);
CREATE INDEX IF NOT EXISTS idx_trade_search_fts ON trade_search_index USING GIN(search_vector);

-- ============================================================================
-- CACHE MANAGEMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cache_store (
    cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(500) UNIQUE NOT NULL,
    cache_value JSONB NOT NULL,
    ttl_seconds INT DEFAULT 3600,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '1 hour',
    
    -- Partitioning hint
    partition_key VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_store(expires_at) WHERE expires_at > CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_store(cache_key);

-- ============================================================================
-- GRANTS & PERMISSIONS
-- ============================================================================

-- Ensure proper access control (if needed, adjust based on your role management)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO trading_user;
