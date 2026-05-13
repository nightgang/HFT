-- Migration: Fix trade_status enum and API request logs schema

-- Ensure the trade_status enum includes the executing state.
DO $$
BEGIN
    ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'executing';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure the API request logs table has the user_agent column.
ALTER TABLE IF EXISTS api_request_logs
ADD COLUMN IF NOT EXISTS user_agent TEXT;
