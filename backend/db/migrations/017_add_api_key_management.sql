-- Migration: Add API Key Management Tables

CREATE TABLE IF NOT EXISTS api_keys (
    key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    scopes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id only if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'api_keys' AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
