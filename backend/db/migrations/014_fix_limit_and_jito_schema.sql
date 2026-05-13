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

-- Add 'accepted' value to bundle_status enum if it doesn't exist and the type exists
DO $$
BEGIN
  -- Check if bundle_status type exists before trying to alter it
  IF EXISTS (
    SELECT 1 FROM pg_type 
    WHERE typname = 'bundle_status' 
      AND typtype = 'e'
  ) THEN
    -- Check if 'accepted' value doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumtypid = 'bundle_status'::regtype 
        AND enumlabel = 'accepted'
    ) THEN
      ALTER TYPE bundle_status ADD VALUE 'accepted';
    END IF;
  END IF;
END$$;

-- Add landed_at field to Jito bundles if table and type both exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'jito_bundles'
  ) THEN
    ALTER TABLE IF EXISTS jito_bundles
      ADD COLUMN IF NOT EXISTS landed_at TIMESTAMP;
  END IF;
END$$;
