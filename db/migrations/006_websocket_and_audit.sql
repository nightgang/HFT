-- Migration: 006_websocket_and_audit
-- Created: 2024-01-01T00:05:00.000Z
-- Description: Create websocket sessions and audit trail tables

-- ============================================================================
-- WEBSOCKET & CONNECTION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS websocket_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    client_info JSONB, -- User agent, IP, etc
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    messages_sent INT DEFAULT 0,
    messages_received INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wallet_sessions ON websocket_sessions(wallet_id, connected_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions ON websocket_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_last_activity ON websocket_sessions(last_activity);

-- ============================================================================
-- AUDIT TRAIL (IMMUTABLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit.key_access_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL, -- Store without FK for audit integrity
    access_type VARCHAR(50) NOT NULL, -- 'decrypt', 'rotate', 'backup', 'restore'
    user_id VARCHAR(255),
    ip_address VARCHAR(45),
    status VARCHAR(20), -- 'success', 'failed'
    error_message TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Immutable: cannot update
);

CREATE INDEX IF NOT EXISTS idx_wallet_access ON audit.key_access_logs(wallet_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_type ON audit.key_access_logs(access_type);

CREATE TABLE IF NOT EXISTS audit.configuration_changes (
    change_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100), -- 'wallet', 'rule', 'api_key'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(255),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entity_changes ON audit.configuration_changes(entity_type, entity_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS audit.error_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code VARCHAR(20),
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB,
    severity VARCHAR(20), -- 'info', 'warning', 'error', 'critical'
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_severity ON audit.error_logs(severity, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolved ON audit.error_logs(resolved);