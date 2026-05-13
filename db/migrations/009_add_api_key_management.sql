-- Migration: 009_add_api_key_management
-- Created: 2026-05-13T18:20:00.000Z
-- Description: Add API key management tables for service access and audit logging

CREATE TABLE IF NOT EXISTS api_keys (
    api_key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(255) NOT NULL DEFAULT 'system',
    key_hash TEXT NOT NULL UNIQUE,
    scopes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_last_used_at ON api_keys(last_used_at);

CREATE TABLE IF NOT EXISTS api_key_access_logs (
    access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(api_key_id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(16) NOT NULL,
    status_code INT,
    remote_ip VARCHAR(50),
    user_agent TEXT,
    request_payload JSONB,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_key_access_logs_api_key_id ON api_key_access_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_access_logs_accessed_at ON api_key_access_logs(accessed_at DESC);
