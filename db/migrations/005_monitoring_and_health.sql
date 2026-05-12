-- Migration: 005_monitoring_and_health
-- Created: 2024-01-01T00:04:00.000Z
-- Description: Create monitoring, health checks, and API logging tables

-- ============================================================================
-- MONITORING & HEALTH
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(18, 4) NOT NULL,
    unit VARCHAR(50),
    tags JSONB, -- Additional context
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metric_name ON system_metrics(metric_name, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_recorded_at ON system_metrics(recorded_at);

CREATE TABLE IF NOT EXISTS health_checks (
    check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    latency_ms INT,
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_status ON health_checks(service_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_checked_at ON health_checks(checked_at DESC);

CREATE TABLE IF NOT EXISTS api_call_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_service VARCHAR(100) NOT NULL, -- 'jupiter', 'helius', 'rpc'
    endpoint VARCHAR(255),
    method VARCHAR(10),
    request_duration_ms INT,
    status_code INT,
    error_message TEXT,
    wallet_id UUID REFERENCES wallets(wallet_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_service ON api_call_logs(api_service, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_created_at ON api_call_logs(created_at DESC);