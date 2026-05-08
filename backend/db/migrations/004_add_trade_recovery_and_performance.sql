-- Migration: Add Trade Recovery Queue and Monitoring Tables

-- Create trade_recovery_queue table for DLQ (Dead Letter Queue)
CREATE TABLE IF NOT EXISTS trade_recovery_queue (
    recovery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL UNIQUE REFERENCES trades(trade_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recovery_queue_status ON trade_recovery_queue(status);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_next_retry ON trade_recovery_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_recovery_queue_created_at ON trade_recovery_queue(created_at DESC);

-- Create performance_snapshots table for historical performance tracking
CREATE TABLE IF NOT EXISTS performance_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    total_trades INTEGER DEFAULT 0,
    successful_trades INTEGER DEFAULT 0,
    failed_trades INTEGER DEFAULT 0,
    win_rate_percent NUMERIC(5, 2) DEFAULT 0,
    roi_percent NUMERIC(8, 4) DEFAULT 0,
    pnl_usd NUMERIC(18, 2) DEFAULT 0,
    max_drawdown_percent NUMERIC(5, 2) DEFAULT 0,
    sharpe_ratio NUMERIC(8, 4) DEFAULT 0,
    snapshot_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_wallet ON performance_snapshots(wallet_id);
CREATE INDEX IF NOT EXISTS idx_performance_snapshot_date ON performance_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_created_at ON performance_snapshots(created_at DESC);

-- Add columns to trades table for better tracking
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS original_trade_id UUID,
  ADD COLUMN IF NOT EXISTS is_recovery_attempt BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recovery_attempt_number INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_trades_recovery_attempt ON trades(is_recovery_attempt);
CREATE INDEX IF NOT EXISTS idx_trades_original_trade_id ON trades(original_trade_id);

-- Record migration
INSERT INTO schema_migrations (migration_name, success)
VALUES ('004_add_trade_recovery_and_performance', true)
ON CONFLICT DO NOTHING;
