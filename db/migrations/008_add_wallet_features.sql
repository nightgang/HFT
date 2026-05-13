-- Migration: 008_add_wallet_features
-- Created: 2026-05-13T06:35:00.000Z
-- Description: Add missing wallet features (hierarchy, spending limits, filters, external wallets)

-- Add missing columns to wallets table
ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS parent_wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS spending_limit_usd NUMERIC(20, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_spending_usd NUMERIC(20, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address_whitelist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS address_blacklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT false;

-- Create index for wallet hierarchy
CREATE INDEX IF NOT EXISTS idx_wallet_parent_id ON wallets(parent_wallet_id);

-- Create index for efficiency on spending limits checks
CREATE INDEX IF NOT EXISTS idx_wallet_spending_limits ON wallets(wallet_id) WHERE spending_limit_usd > 0;

-- Create index for external wallet queries
CREATE INDEX IF NOT EXISTS idx_wallet_external ON wallets(is_external);
