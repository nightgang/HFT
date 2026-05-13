-- Migration: Fix trade_status enum to include active state

DO $$
BEGIN
    ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'active';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure existing API request logs schema remains compatible
ALTER TABLE IF EXISTS api_request_logs
ADD COLUMN IF NOT EXISTS user_agent TEXT;
