-- Migration: Add audit logging and test infrastructure tables

-- Create audit_logs table for security audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Create health_checks table for system monitoring
CREATE TABLE IF NOT EXISTS health_checks (
    health_check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'healthy',
    latency_ms INTEGER,
    error_message TEXT,
    details JSONB,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_checked_at ON health_checks(checked_at DESC);

-- Create api_request_logs table for request tracking
CREATE TABLE IF NOT EXISTS api_request_logs (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    client_ip INET,
    user_id UUID,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_requests_path ON api_request_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_requests_status ON api_request_logs(status_code);
CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_request_logs(user_id);

-- Create error_logs table for comprehensive error tracking
CREATE TABLE IF NOT EXISTS error_logs (
    error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(255) NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    severity VARCHAR(50) DEFAULT 'error',
    context JSONB,
    resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- Create metrics_snapshots table for performance monitoring
CREATE TABLE IF NOT EXISTS metrics_snapshots (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(18, 8),
    metric_unit VARCHAR(50),
    tags JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics_snapshots(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON metrics_snapshots(recorded_at DESC);

-- Create circuit_breaker_state table for tracking circuit breaker status
CREATE TABLE IF NOT EXISTS circuit_breaker_state (
    breaker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(255) UNIQUE NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'closed',
    failure_count INTEGER DEFAULT 0,
    last_failure_at TIMESTAMP,
    last_reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_circuit_breaker_service ON circuit_breaker_state(service_name);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_state ON circuit_breaker_state(state);

-- Record migration
INSERT INTO schema_migrations (migration_name, success)
VALUES ('003_add_audit_logging_and_monitoring', true)
ON CONFLICT DO NOTHING;
