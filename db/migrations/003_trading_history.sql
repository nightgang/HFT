-- Migration: 003_trading_history
-- Created: 2024-01-01T00:02:00.000Z
-- Description: Create trading history tables

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
CREATE INDEX IF NOT EXISTS idx_strategy_created_at ON trades(strategy_type, created_at DESC);

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