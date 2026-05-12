-- Migration 009: Fix schema gaps for advanced orders, limit orders, and Jito bundles

-- Add missing advanced order fields used by application code
ALTER TABLE IF EXISTS advanced_orders
  ADD COLUMN IF NOT EXISTS executed_price NUMERIC(38, 8),
  ADD COLUMN IF NOT EXISTS tx_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_executed BOOLEAN DEFAULT false;

-- Add missing limit order tracking fields used by application code
ALTER TABLE IF EXISTS limit_orders
  ADD COLUMN IF NOT EXISTS filled_amount NUMERIC(38, 8) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS execution_tx_signatures VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
  ADD COLUMN IF NOT EXISTS average_fill_price NUMERIC(38, 8),
  ADD COLUMN IF NOT EXISTS filled_at TIMESTAMP;

-- Convert limit_orders.status to a flexible VARCHAR so application status values can be stored
ALTER TABLE IF EXISTS limit_orders
  ALTER COLUMN status DROP DEFAULT;
ALTER TABLE IF EXISTS limit_orders
  ALTER COLUMN status TYPE VARCHAR(50) USING status::VARCHAR;
ALTER TABLE IF EXISTS limit_orders
  ALTER COLUMN status SET DEFAULT 'pending';

-- Add missing landed_at field and accepted status for Jito bundle lifecycle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'bundle_status'
      AND e.enumlabel = 'accepted'
  ) THEN
    ALTER TYPE bundle_status ADD VALUE 'accepted';
  END IF;
END$$;

ALTER TABLE IF EXISTS jito_bundles
  ADD COLUMN IF NOT EXISTS landed_at TIMESTAMP;

-- Record migration execution state
INSERT INTO schema_migrations (migration_name, success)
VALUES ('009_fix_limit_and_jito_schema', true)
ON CONFLICT DO NOTHING;
