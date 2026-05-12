-- Migration: 002_wallets_and_balances
-- Created: 2024-01-01T00:01:00.000Z
-- Description: Create wallets, balances, and performance tables

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
) PARTITION BY HASH (wallet_id);

-- Create 4 partitions for wallet sharding
CREATE TABLE IF NOT EXISTS wallets_0 PARTITION OF wallets FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE IF NOT EXISTS wallets_1 PARTITION OF wallets FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE IF NOT EXISTS wallets_2 PARTITION OF wallets FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE IF NOT EXISTS wallets_3 PARTITION OF wallets FOR VALUES WITH (MODULUS 4, REMAINDER 3);

CREATE INDEX IF NOT EXISTS idx_wallet_address ON wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_active_wallets ON wallets(is_active);
CREATE INDEX IF NOT EXISTS idx_wallet_created_at ON wallets(created_at DESC);

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