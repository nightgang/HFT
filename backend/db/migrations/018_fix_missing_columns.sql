-- Migration: Fix missing columns in advanced features tables
-- This migration adds any missing columns to ensure schema consistency

-- Add is_active to advanced_orders if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'advanced_orders' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE advanced_orders ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add expires_at to advanced_orders if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'advanced_orders' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE advanced_orders ADD COLUMN expires_at TIMESTAMP;
    END IF;
END $$;

-- Add submitted_at to jito_bundles if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'jito_bundles' AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE jito_bundles ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add expires_at to limit_orders if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'limit_orders' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE limit_orders ADD COLUMN expires_at TIMESTAMP;
    END IF;
END $$;