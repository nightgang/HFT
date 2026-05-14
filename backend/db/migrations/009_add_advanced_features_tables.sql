-- Migration: Add Advanced Features Tables

-- ============================================================================
-- ADVANCED ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS advanced_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    order_type VARCHAR(50) NOT NULL, -- 'limit', 'stop_loss', 'take_profit', 'conditional'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'executed', 'cancelled', 'expired'

    -- Token Details
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8) NOT NULL,

    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),

    -- Pricing
    trigger_price NUMERIC(38, 8),
    limit_price NUMERIC(38, 8),
    stop_loss_price NUMERIC(38, 8),
    take_profit_price NUMERIC(38, 8),

    -- Conditions
    condition_type VARCHAR(50), -- 'price_above', 'price_below', 'price_between', 'volatility_above', 'time_based'
    condition_value NUMERIC(38, 8),
    condition_metadata JSONB,

    -- Timing
    execute_at TIMESTAMP,
    expires_at TIMESTAMP,

    -- Execution
    executed_at TIMESTAMP,
    executed_price NUMERIC(38, 8),
    tx_signature VARCHAR(255),

    -- Metadata
    metadata JSONB,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advanced_orders_wallet ON advanced_orders(wallet_id);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_status ON advanced_orders(status);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_type ON advanced_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_execute_at ON advanced_orders(execute_at);

-- Create index on expires_at only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'advanced_orders' AND column_name = 'expires_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_advanced_orders_expires_at ON advanced_orders(expires_at);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_advanced_orders_created_at ON advanced_orders(created_at DESC);

-- ============================================================================
-- LIMIT ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS limit_orders (
    limit_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'partially_filled', 'filled', 'cancelled'

    -- Token Details
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8) NOT NULL,
    filled_amount NUMERIC(38, 8) DEFAULT 0,

    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),
    expected_output_amount NUMERIC(38, 8),
    min_output_amount NUMERIC(38, 8),

    -- Pricing
    limit_price NUMERIC(38, 8) NOT NULL,
    slippage_percent NUMERIC(8, 4) DEFAULT 1.0,

    -- Timing
    expires_at TIMESTAMP,
    executed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_limit_orders_wallet ON limit_orders(wallet_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_status ON limit_orders(status);

-- Create index on expires_at only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'limit_orders' AND column_name = 'expires_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_limit_orders_expires_at ON limit_orders(expires_at);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_limit_orders_created_at ON limit_orders(created_at DESC);

-- ============================================================================
-- LIQUIDITY POOLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS liquidity_pools (
    pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    pool_address VARCHAR(255) NOT NULL,
    amm_provider VARCHAR(50) NOT NULL, -- 'raydium', 'orca', 'jupiter'

    -- Pool Tokens
    token_a_mint VARCHAR(255) NOT NULL,
    token_a_symbol VARCHAR(20),
    token_a_amount NUMERIC(38, 8) NOT NULL,

    token_b_mint VARCHAR(255) NOT NULL,
    token_b_symbol VARCHAR(20),
    token_b_amount NUMERIC(38, 8) NOT NULL,

    -- Pool Metrics
    total_liquidity_usd NUMERIC(18, 2),
    pool_share_percent NUMERIC(8, 4),
    fees_earned NUMERIC(38, 8) DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'removed'
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liquidity_pools_wallet ON liquidity_pools(wallet_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_address ON liquidity_pools(pool_address);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_provider ON liquidity_pools(amm_provider);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_status ON liquidity_pools(status);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_created_at ON liquidity_pools(created_at DESC);

-- ============================================================================
-- JITO BUNDLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS jito_bundles (
    bundle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    bundle_hash VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'submitted', 'confirmed', 'failed', 'dropped'

    -- Bundle Details
    transactions JSONB NOT NULL, -- Array of serialized transactions
    tip_amount_lamports BIGINT,
    priority_fee_lamports BIGINT,

    -- Timing
    submitted_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    landed_at TIMESTAMP,

    -- Results
    slot_landed BIGINT,
    mev_reward_lamports BIGINT,

    -- Metadata
    metadata JSONB,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jito_bundles_wallet ON jito_bundles(wallet_id);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_hash ON jito_bundles(bundle_hash);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_status ON jito_bundles(status);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_submitted_at ON jito_bundles(submitted_at);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_created_at ON jito_bundles(created_at DESC);

-- ============================================================================
-- PREDICTIVE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS predictive_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- 'price_prediction', 'volatility_spike', 'liquidity_dry_up', 'whale_movement'
    severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

    -- Alert Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    prediction_confidence NUMERIC(5, 2), -- 0-100

    -- Token/Context
    token_mint VARCHAR(255),
    token_symbol VARCHAR(20),

    -- Prediction Data
    predicted_value NUMERIC(38, 8),
    predicted_at TIMESTAMP,
    actual_value NUMERIC(38, 8),
    actual_at TIMESTAMP,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'triggered', 'expired', 'dismissed'
    triggered_at TIMESTAMP,
    dismissed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictive_alerts_wallet ON predictive_alerts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_type ON predictive_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_severity ON predictive_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_status ON predictive_alerts(status);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_predicted_at ON predictive_alerts(predicted_at);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_created_at ON predictive_alerts(created_at DESC);

-- ============================================================================
-- RISK HEATMAP
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_heatmap (
    heatmap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),

    -- Risk Scores (0-100)
    liquidity_risk NUMERIC(5, 2),
    volatility_risk NUMERIC(5, 2),
    impermanent_loss_risk NUMERIC(5, 2),
    smart_money_risk NUMERIC(5, 2),
    overall_risk_score NUMERIC(5, 2),

    -- Risk Factors
    risk_factors JSONB, -- Detailed breakdown
    risk_trend VARCHAR(20), -- 'increasing', 'decreasing', 'stable'

    -- Position Data
    position_size_usd NUMERIC(18, 2),
    position_age_days INTEGER,

    -- Calculated At
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_heatmap_wallet ON risk_heatmap(wallet_id);
CREATE INDEX IF NOT EXISTS idx_risk_heatmap_token ON risk_heatmap(token_mint);
CREATE INDEX IF NOT EXISTS idx_risk_heatmap_score ON risk_heatmap(overall_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_risk_heatmap_calculated_at ON risk_heatmap(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_heatmap_created_at ON risk_heatmap(created_at DESC);

-- ============================================================================
-- PERFORMANCE ATTRIBUTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_attribution (
    attribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Overall Performance
    total_return_percent NUMERIC(8, 4),
    benchmark_return_percent NUMERIC(8, 4),
    excess_return_percent NUMERIC(8, 4),

    -- Attribution Breakdown
    strategy_contribution JSONB, -- Breakdown by strategy type
    asset_contribution JSONB, -- Breakdown by token/asset
    timing_contribution JSONB, -- Market timing effects

    -- Risk Metrics
    volatility_contribution NUMERIC(8, 4),
    max_drawdown_contribution NUMERIC(8, 4),

    -- Metadata
    metadata JSONB,
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_attribution_wallet ON performance_attribution(wallet_id);
CREATE INDEX IF NOT EXISTS idx_performance_attribution_period ON performance_attribution(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_performance_attribution_created_at ON performance_attribution(created_at DESC);

-- ============================================================================
-- SENTIMENT ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentiment_data (
    sentiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),

    -- Sentiment Scores (-1 to 1)
    overall_sentiment NUMERIC(3, 2), -- -1 (bearish) to 1 (bullish)
    social_sentiment NUMERIC(3, 2),
    news_sentiment NUMERIC(3, 2),
    on_chain_sentiment NUMERIC(3, 2),

    -- Data Sources
    social_mentions INTEGER DEFAULT 0,
    news_articles INTEGER DEFAULT 0,
    social_volume INTEGER DEFAULT 0,

    -- Trend Analysis
    sentiment_trend VARCHAR(20), -- 'bullish', 'bearish', 'neutral'
    momentum_score NUMERIC(5, 2),

    -- Calculated At
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    metadata JSONB,
    sources JSONB, -- Source URLs/articles

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sentiment_token ON sentiment_data(token_mint);
CREATE INDEX IF NOT EXISTS idx_sentiment_score ON sentiment_data(overall_sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiment_trend ON sentiment_data(sentiment_trend);
CREATE INDEX IF NOT EXISTS idx_sentiment_calculated_at ON sentiment_data(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_created_at ON sentiment_data(created_at DESC);

-- ============================================================================
-- CROSS-CHAIN BRIDGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cross_chain_bridges (
    bridge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'initiated', 'confirmed', 'completed', 'failed'

    -- Source Chain
    source_chain VARCHAR(50) NOT NULL, -- 'solana', 'ethereum', 'polygon', etc
    source_tx_hash VARCHAR(255),
    source_token_mint VARCHAR(255) NOT NULL,
    source_token_symbol VARCHAR(20),
    source_amount NUMERIC(38, 8) NOT NULL,

    -- Destination Chain
    destination_chain VARCHAR(50) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    destination_token_mint VARCHAR(255),
    destination_token_symbol VARCHAR(20),
    expected_destination_amount NUMERIC(38, 8),

    -- Bridge Details
    bridge_provider VARCHAR(100) NOT NULL, -- 'wormhole', 'allbridge', 'debridge'
    bridge_fee_usd NUMERIC(18, 2),
    estimated_completion_time TIMESTAMP,

    -- Completion
    destination_tx_hash VARCHAR(255),
    actual_destination_amount NUMERIC(38, 8),
    completed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cross_chain_wallet ON cross_chain_bridges(wallet_id);
CREATE INDEX IF NOT EXISTS idx_cross_chain_status ON cross_chain_bridges(status);
CREATE INDEX IF NOT EXISTS idx_cross_chain_provider ON cross_chain_bridges(bridge_provider);
CREATE INDEX IF NOT EXISTS idx_cross_chain_source_chain ON cross_chain_bridges(source_chain);
CREATE INDEX IF NOT EXISTS idx_cross_chain_dest_chain ON cross_chain_bridges(destination_chain);
CREATE INDEX IF NOT EXISTS idx_cross_chain_created_at ON cross_chain_bridges(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_advanced_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER advanced_orders_update_timestamp
BEFORE UPDATE ON advanced_orders
FOR EACH ROW
EXECUTE FUNCTION update_advanced_orders_timestamp();

CREATE OR REPLACE FUNCTION update_limit_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_orders_update_timestamp
BEFORE UPDATE ON limit_orders
FOR EACH ROW
EXECUTE FUNCTION update_limit_orders_timestamp();

CREATE OR REPLACE FUNCTION update_liquidity_pools_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER liquidity_pools_update_timestamp
BEFORE UPDATE ON liquidity_pools
FOR EACH ROW
EXECUTE FUNCTION update_liquidity_pools_timestamp();

CREATE OR REPLACE FUNCTION update_jito_bundles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jito_bundles_update_timestamp
BEFORE UPDATE ON jito_bundles
FOR EACH ROW
EXECUTE FUNCTION update_jito_bundles_timestamp();

CREATE OR REPLACE FUNCTION update_predictive_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictive_alerts_update_timestamp
BEFORE UPDATE ON predictive_alerts
FOR EACH ROW
EXECUTE FUNCTION update_predictive_alerts_timestamp();

CREATE OR REPLACE FUNCTION update_cross_chain_bridges_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cross_chain_bridges_update_timestamp
BEFORE UPDATE ON cross_chain_bridges
FOR EACH ROW
EXECUTE FUNCTION update_cross_chain_bridges_timestamp();

-- Record migration
INSERT INTO schema_migrations (migration_name, success)
VALUES ('007_add_advanced_features_tables', true)
ON CONFLICT DO NOTHING;