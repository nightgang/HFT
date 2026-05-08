-- Migration: Add wallet hierarchy, spending limits, and additional database indexes

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS parent_wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS spending_limit_usd NUMERIC(18, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_spending_usd NUMERIC(18, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_wallet_parent ON wallets(parent_wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_spending_limit ON wallets(spending_limit_usd);
CREATE INDEX IF NOT EXISTS idx_wallet_daily_spending ON wallets(daily_spending_usd);
CREATE INDEX IF NOT EXISTS idx_wallet_type ON wallets(wallet_type);

CREATE INDEX IF NOT EXISTS idx_risk_violation_wallet_type ON risk_violations(wallet_id, violation_type);
CREATE INDEX IF NOT EXISTS idx_trade_wallet_status ON trades(wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_trade_strategy_status ON trades(strategy_type, status);

INSERT INTO schema_migrations (migration_name, success)
VALUES ('002_wallet_hierarchy_limits_and_indexing', true);
