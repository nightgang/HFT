-- Migration: Add Advanced Features Tables

-- Advanced Orders
CREATE TABLE IF NOT EXISTS advanced_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    order_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8) NOT NULL,
    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),
    trigger_price NUMERIC(38, 8),
    limit_price NUMERIC(38, 8),
    stop_loss_price NUMERIC(38, 8),
    take_profit_price NUMERIC(38, 8),
    condition_type VARCHAR(50),
    condition_value NUMERIC(38, 8),
    condition_metadata JSONB,
    execute_at TIMESTAMP,
    expires_at TIMESTAMP,
    executed_at TIMESTAMP,
    executed_price NUMERIC(38, 8),
    tx_signature VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advanced_orders_wallet ON advanced_orders(wallet_id);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_status ON advanced_orders(status);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_type ON advanced_orders(order_type);

-- Liquidity Pools
CREATE TABLE IF NOT EXISTS liquidity_pools (
    pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol VARCHAR(50) NOT NULL,
    pool_address VARCHAR(255) NOT NULL,
    token_a_mint VARCHAR(255) NOT NULL,
    token_a_symbol VARCHAR(20),
    token_b_mint VARCHAR(255) NOT NULL,
    token_b_symbol VARCHAR(20),
    liquidity NUMERIC(38, 8),
    fee_percent NUMERIC(5, 4),
    apr_percent NUMERIC(8, 4),
    tvl_usd NUMERIC(18, 2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liquidity_pools_protocol ON liquidity_pools(protocol);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_address ON liquidity_pools(pool_address);

-- Liquidity Positions
CREATE TABLE IF NOT EXISTS liquidity_positions (
    position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES liquidity_pools(pool_id) ON DELETE CASCADE,
    token_a_amount NUMERIC(38, 8),
    token_b_amount NUMERIC(38, 8),
    lp_tokens NUMERIC(38, 8),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liquidity_positions_wallet ON liquidity_positions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_positions_pool ON liquidity_positions(pool_id);

-- Limit Orders
CREATE TABLE IF NOT EXISTS limit_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    side VARCHAR(10) NOT NULL,
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8),
    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),
    limit_price NUMERIC(38, 8) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    executed_at TIMESTAMP,
    executed_price NUMERIC(38, 8),
    tx_signature VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_limit_orders_wallet ON limit_orders(wallet_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);

-- PnL Snapshots
CREATE TABLE IF NOT EXISTS pnl_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_pnl_usd NUMERIC(18, 2) DEFAULT 0,
    realized_pnl_usd NUMERIC(18, 2) DEFAULT 0,
    unrealized_pnl_usd NUMERIC(18, 2) DEFAULT 0,
    fees_paid_usd NUMERIC(18, 2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_wallet ON pnl_snapshots(wallet_id);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_date ON pnl_snapshots(snapshot_date);

-- Strategy Performance
CREATE TABLE IF NOT EXISTS strategy_performance (
    performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    strategy_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    pnl_usd NUMERIC(18, 2) DEFAULT 0,
    roi_percent NUMERIC(8, 4) DEFAULT 0,
    win_rate_percent NUMERIC(5, 2) DEFAULT 0,
    avg_trade_size_usd NUMERIC(18, 2) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_strategy_performance_wallet ON strategy_performance(wallet_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_type ON strategy_performance(strategy_type);

-- Token Attribution
CREATE TABLE IF NOT EXISTS token_attribution (
    attribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    attribution_type VARCHAR(50) NOT NULL,
    amount NUMERIC(38, 8) NOT NULL,
    usd_value NUMERIC(18, 2),
    source VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_token_attribution_wallet ON token_attribution(wallet_id);
CREATE INDEX IF NOT EXISTS idx_token_attribution_token ON token_attribution(token_mint);

-- Position Concentration
CREATE TABLE IF NOT EXISTS position_concentration (
    concentration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    position_size_usd NUMERIC(18, 2) NOT NULL,
    portfolio_percentage NUMERIC(5, 2) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'low',
    metadata JSONB,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_position_concentration_wallet ON position_concentration(wallet_id);
CREATE INDEX IF NOT EXISTS idx_position_concentration_token ON position_concentration(token_mint);

-- Correlation Matrix
CREATE TABLE IF NOT EXISTS correlation_matrix (
    correlation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    token_a_mint VARCHAR(255) NOT NULL,
    token_a_symbol VARCHAR(20),
    token_b_mint VARCHAR(255) NOT NULL,
    token_b_symbol VARCHAR(20),
    correlation_coefficient NUMERIC(5, 4),
    time_period_days INTEGER DEFAULT 30,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_correlation_matrix_wallet ON correlation_matrix(wallet_id);
CREATE INDEX IF NOT EXISTS idx_correlation_matrix_tokens ON correlation_matrix(token_a_mint, token_b_mint);

-- Predictive Alerts
CREATE TABLE IF NOT EXISTS predictive_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    message TEXT NOT NULL,
    predicted_impact_usd NUMERIC(18, 2),
    confidence_percent NUMERIC(5, 2),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_predictive_alerts_wallet ON predictive_alerts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_type ON predictive_alerts(alert_type);

-- Anomaly Logs
CREATE TABLE IF NOT EXISTS anomaly_logs (
    anomaly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    anomaly_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'low',
    detected_value NUMERIC(18, 2),
    expected_value NUMERIC(18, 2),
    confidence_score NUMERIC(5, 2),
    metadata JSONB,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anomaly_logs_wallet ON anomaly_logs(wallet_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_logs_type ON anomaly_logs(anomaly_type);

-- Sentiment Scores
CREATE TABLE IF NOT EXISTS sentiment_scores (
    sentiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    source VARCHAR(50) NOT NULL,
    sentiment_score NUMERIC(3, 2), -- -1 to 1
    confidence NUMERIC(5, 2),
    volume_mentions INTEGER DEFAULT 0,
    metadata JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sentiment_scores_token ON sentiment_scores(token_mint);
CREATE INDEX IF NOT EXISTS idx_sentiment_scores_source ON sentiment_scores(source);

-- Social Signals
CREATE TABLE IF NOT EXISTS social_signals (
    signal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    platform VARCHAR(50) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    sentiment VARCHAR(20),
    engagement_score INTEGER DEFAULT 0,
    influencer_followers INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_signals_token ON social_signals(token_mint);
CREATE INDEX IF NOT EXISTS idx_social_signals_platform ON social_signals(platform);

-- Cross Chain Transactions
CREATE TABLE IF NOT EXISTS cross_chain_transactions (
    tx_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    source_chain VARCHAR(50) NOT NULL,
    destination_chain VARCHAR(50) NOT NULL,
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    amount NUMERIC(38, 8) NOT NULL,
    bridge_provider VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    tx_hash_source VARCHAR(255),
    tx_hash_destination VARCHAR(255),
    fee_usd NUMERIC(18, 2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cross_chain_wallet ON cross_chain_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_cross_chain_status ON cross_chain_transactions(status);

-- Bridge Records
CREATE TABLE IF NOT EXISTS bridge_records (
    record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    bridge_provider VARCHAR(50) NOT NULL,
    source_chain VARCHAR(50) NOT NULL,
    destination_chain VARCHAR(50) NOT NULL,
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),
    amount NUMERIC(38, 8) NOT NULL,
    fee_amount NUMERIC(38, 8),
    status VARCHAR(50) DEFAULT 'pending',
    tx_hash VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bridge_records_wallet ON bridge_records(wallet_id);
CREATE INDEX IF NOT EXISTS idx_bridge_records_provider ON bridge_records(bridge_provider);

-- Jito Bundles
CREATE TABLE IF NOT EXISTS jito_bundles (
    bundle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    bundle_hash VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    tip_amount_lamports BIGINT,
    transactions JSONB,
    landed_slot BIGINT,
    landed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jito_bundles_wallet ON jito_bundles(wallet_id);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_status ON jito_bundles(status);

-- Trade Search Index
CREATE TABLE IF NOT EXISTS trade_search_index (
    index_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES trades(trade_id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    search_tokens TSVECTOR,
    metadata JSONB,
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_search_tokens ON trade_search_index USING GIN(search_tokens);
CREATE INDEX IF NOT EXISTS idx_trade_search_trade ON trade_search_index(trade_id);

-- Cache Store
CREATE TABLE IF NOT EXISTS cache_store (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_value JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cache_store_expires ON cache_store(expires_at);