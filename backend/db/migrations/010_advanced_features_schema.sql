-- Migration: Advanced features schema
-- Adds tables for advanced orders, limit orders, cross-chain transactions, Jito bundles, liquidity pools, predictive alerts, risk heatmap, sentiment scores, P&L snapshots

-- Create custom types for advanced features ONLY if they don't exist
-- These enums add to existing ones from migration 001 (trade_direction)
DO $$ BEGIN
    CREATE TYPE order_type AS ENUM ('limit', 'stop_loss', 'take_profit', 'trailing_stop', 'bracket', 'oco');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'active', 'executed', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bundle_status AS ENUM ('pending', 'submitted', 'landed', 'dropped', 'failed', 'accepted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bridge_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_trend AS ENUM ('increasing', 'decreasing', 'stable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sentiment_trend AS ENUM ('bullish', 'bearish', 'neutral');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ADVANCED ORDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS advanced_orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    order_type order_type NOT NULL,
    status order_status DEFAULT 'pending',

    -- Token details
    input_token_mint VARCHAR(255) NOT NULL,
    input_token_symbol VARCHAR(20),
    input_amount NUMERIC(38, 8) NOT NULL,

    output_token_mint VARCHAR(255) NOT NULL,
    output_token_symbol VARCHAR(20),

    -- Pricing conditions
    trigger_price NUMERIC(38, 8),
    limit_price NUMERIC(38, 8),
    stop_loss_price NUMERIC(38, 8),
    take_profit_price NUMERIC(38, 8),

    -- Execution conditions
    condition_type VARCHAR(100), -- 'price_above', 'price_below', 'time_based', etc.
    condition_value JSONB, -- Flexible condition parameters
    condition_metadata JSONB,

    -- Timing
    execute_at TIMESTAMP,
    expires_at TIMESTAMP,
    executed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advanced_orders_wallet ON advanced_orders(wallet_id);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_status ON advanced_orders(status);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_type ON advanced_orders(order_type);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_execute_at ON advanced_orders(execute_at);
CREATE INDEX IF NOT EXISTS idx_advanced_orders_expires_at ON advanced_orders(expires_at);

-- ============================================================================
-- JITO BUNDLES - Add missing columns if table exists
-- ============================================================================

-- Add columns to jito_bundles if they don't exist
DO $$
BEGIN
    -- Add bundle_hash if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jito_bundles' AND column_name = 'bundle_hash'
    ) THEN
        ALTER TABLE jito_bundles ADD COLUMN bundle_hash VARCHAR(255) UNIQUE;
    END IF;

    -- Add status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jito_bundles' AND column_name = 'status'
    ) THEN
        ALTER TABLE jito_bundles ADD COLUMN status bundle_status DEFAULT 'pending';
    END IF;

    -- Add tip_amount_lamports if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jito_bundles' AND column_name = 'tip_amount_lamports'
    ) THEN
        ALTER TABLE jito_bundles ADD COLUMN tip_amount_lamports BIGINT;
        ALTER TABLE jito_bundles ADD COLUMN priority_fee_lamports BIGINT;
    END IF;

    -- Add execution details if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jito_bundles' AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE jito_bundles ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE jito_bundles ADD COLUMN slot_submitted BIGINT;
        ALTER TABLE jito_bundles ADD COLUMN slot_landed BIGINT;
        ALTER TABLE jito_bundles ADD COLUMN IF NOT EXISTS landed_at TIMESTAMP;
        ALTER TABLE jito_bundles ADD COLUMN IF NOT EXISTS metadata JSONB;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jito_bundles_wallet ON jito_bundles(wallet_id);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_status ON jito_bundles(status);
CREATE INDEX IF NOT EXISTS idx_jito_bundles_hash ON jito_bundles(bundle_hash);

-- Create index on submitted_at only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jito_bundles' AND column_name = 'submitted_at'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_jito_bundles_submitted_at ON jito_bundles(submitted_at);
    END IF;
END $$;

-- ============================================================================
-- LIQUIDITY POOLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS liquidity_pools (
    pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,

    -- Pool details
    pool_address VARCHAR(255) UNIQUE NOT NULL,
    amm_provider VARCHAR(100) NOT NULL, -- 'raydium', 'orca', 'jupiter'

    -- Token A
    token_a_mint VARCHAR(255) NOT NULL,
    token_a_symbol VARCHAR(20),
    token_a_amount NUMERIC(38, 8) NOT NULL,

    -- Token B
    token_b_mint VARCHAR(255) NOT NULL,
    token_b_symbol VARCHAR(20),
    token_b_amount NUMERIC(38, 8) NOT NULL,

    -- Pool metrics
    total_liquidity_usd NUMERIC(18, 2),
    pool_share_percent NUMERIC(8, 4),

    -- Status
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_liquidity_pools_wallet ON liquidity_pools(wallet_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_address ON liquidity_pools(pool_address);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_provider ON liquidity_pools(amm_provider);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_active ON liquidity_pools(is_active);

-- ============================================================================
-- PREDICTIVE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS predictive_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,

    -- Alert details
    alert_type VARCHAR(100) NOT NULL, -- 'price_prediction', 'volatility_spike', 'liquidity_dryup'
    severity alert_severity NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'

    -- Detection
    detected_pattern VARCHAR(255),
    confidence_score NUMERIC(5, 4), -- 0.0000 to 1.0000

    -- Token context
    token_mint VARCHAR(255),
    token_symbol VARCHAR(20),

    -- Alert content
    message TEXT NOT NULL,
    recommendation TEXT,

    -- Timing
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictive_alerts_wallet ON predictive_alerts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_type ON predictive_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_severity ON predictive_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_status ON predictive_alerts(status);
CREATE INDEX IF NOT EXISTS idx_predictive_alerts_token ON predictive_alerts(token_mint);

-- ============================================================================
-- RISK HEATMAP
-- ============================================================================

CREATE TABLE IF NOT EXISTS risk_heatmap (
    risk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,

    -- Token details
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),

    -- Risk scores (0-100)
    liquidity_risk INT CHECK (liquidity_risk >= 0 AND liquidity_risk <= 100),
    volatility_risk INT CHECK (volatility_risk >= 0 AND volatility_risk <= 100),
    impermanent_loss_risk INT CHECK (impermanent_loss_risk >= 0 AND impermanent_loss_risk <= 100),
    smart_money_risk INT CHECK (smart_money_risk >= 0 AND smart_money_risk <= 100),
    overall_risk_score INT CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),

    -- Risk analysis
    risk_factors JSONB, -- Array of risk factor objects
    risk_trend risk_trend,

    -- Position context
    position_size_usd NUMERIC(18, 2),
    position_age_days INT,

    -- Metadata
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_risk_heatmap_wallet ON risk_heatmap(wallet_id);
CREATE INDEX IF NOT EXISTS idx_risk_heatmap_token ON risk_heatmap(token_mint);
CREATE INDEX IF NOT EXISTS idx_risk_heatmap_overall_score ON risk_heatmap(overall_risk_score);
CREATE INDEX IF NOT EXISTS idx_risk_heatmap_recorded_at ON risk_heatmap(recorded_at DESC);

-- ============================================================================
-- SENTIMENT SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sentiment_scores (
    sentiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Token details
    token_mint VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20),

    -- Sentiment scores (-1 to 1)
    overall_sentiment NUMERIC(3, 2) CHECK (overall_sentiment >= -1 AND overall_sentiment <= 1),
    twitter_sentiment NUMERIC(3, 2) CHECK (twitter_sentiment >= -1 AND twitter_sentiment <= 1),
    discord_sentiment NUMERIC(3, 2) CHECK (discord_sentiment >= -1 AND discord_sentiment <= 1),
    reddit_sentiment NUMERIC(3, 2) CHECK (reddit_sentiment >= -1 AND reddit_sentiment <= 1),

    -- Social metrics
    mention_count INT DEFAULT 0,
    influencer_mentions INT DEFAULT 0,

    -- Trend analysis
    sentiment_trend sentiment_trend,
    trend_velocity NUMERIC(5, 2), -- Rate of change

    -- Data source
    data_source VARCHAR(100), -- 'lunarcrush', 'santiment', 'custom'

    -- Metadata
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sentiment_token ON sentiment_scores(token_mint);
CREATE INDEX IF NOT EXISTS idx_sentiment_overall ON sentiment_scores(overall_sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiment_trend ON sentiment_scores(sentiment_trend);
CREATE INDEX IF NOT EXISTS idx_sentiment_recorded_at ON sentiment_scores(recorded_at DESC);

-- ============================================================================
-- P&L SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pnl_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(wallet_id) ON DELETE CASCADE,

    -- P&L values
    realized_pnl_usd NUMERIC(18, 2) DEFAULT 0,
    unrealized_pnl_usd NUMERIC(18, 2) DEFAULT 0,
    total_pnl_usd NUMERIC(18, 2) DEFAULT 0,

    -- P&L percentages
    realized_pnl_percent NUMERIC(8, 4),
    unrealized_pnl_percent NUMERIC(8, 4),

    -- Portfolio metrics
    total_portfolio_value_usd NUMERIC(18, 2),
    total_invested_usd NUMERIC(18, 2),

    -- Performance metrics
    daily_return_percent NUMERIC(8, 4),
    weekly_return_percent NUMERIC(8, 4),
    monthly_return_percent NUMERIC(8, 4),
    sharpe_ratio NUMERIC(8, 4),
    max_drawdown_percent NUMERIC(8, 4),

    -- Metadata
    snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_wallet ON pnl_snapshots(wallet_id);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_total_pnl ON pnl_snapshots(total_pnl_usd);
CREATE INDEX IF NOT EXISTS idx_pnl_snapshots_snapshot_at ON pnl_snapshots(snapshot_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Update advanced_orders timestamp
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

-- Update limit_orders timestamp
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

-- Update cross_chain_transactions timestamp
CREATE OR REPLACE FUNCTION update_cross_chain_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cross_chain_update_timestamp
BEFORE UPDATE ON cross_chain_transactions
FOR EACH ROW
EXECUTE FUNCTION update_cross_chain_timestamp();

-- Update jito_bundles timestamp
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

-- Update liquidity_pools timestamp
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

-- Update predictive_alerts timestamp
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

-- Record migration
INSERT INTO schema_migrations (migration_name, success)
VALUES ('007_advanced_features_schema', true)
ON CONFLICT DO NOTHING;
