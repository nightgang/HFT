-- Migration: Add Trading Alerts and Notifications System
-- Created: 2026-05-13
-- Description: Add tables for automated trading alerts and user notifications

-- Enum types for alerts and notifications
DO $$ BEGIN
    CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('active', 'triggered', 'resolved', 'muted', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('price_alert', 'volume_alert', 'trade_execution', 'risk_violation', 'system_alert', 'portfolio_update');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'webhook', 'in_app');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'bounced');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Trading Alerts table
CREATE TABLE IF NOT EXISTS trading_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    alert_name VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- price_alert, volume_alert, etc.
    severity alert_severity DEFAULT 'medium',
    status alert_status DEFAULT 'active',
    condition_json JSONB NOT NULL, -- Stores alert conditions (price threshold, volume, etc.)
    token_mint VARCHAR(255),
    triggered_count INT DEFAULT 0,
    last_triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_trading_alerts_user_id ON trading_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_alerts_token_mint ON trading_alerts(token_mint);
CREATE INDEX IF NOT EXISTS idx_trading_alerts_status ON trading_alerts(status);
CREATE INDEX IF NOT EXISTS idx_trading_alerts_is_active ON trading_alerts(is_active);

-- User Notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional context (trade ID, alert ID, etc.)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);

-- Notification Delivery Channels (user preferences)
CREATE TABLE IF NOT EXISTS notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    email_address VARCHAR(255),
    phone_number VARCHAR(20),
    do_not_disturb_start TIME,
    do_not_disturb_end TIME,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Notification Delivery Logs
CREATE TABLE IF NOT EXISTS notification_delivery_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES user_notifications(notification_id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    status notification_status DEFAULT 'pending',
    recipient VARCHAR(255),
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_notification_id ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_channel ON notification_delivery_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_delivery_logs_status ON notification_delivery_logs(status);

-- Alert Trigger History
CREATE TABLE IF NOT EXISTS alert_trigger_history (
    trigger_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES trading_alerts(alert_id) ON DELETE CASCADE,
    trigger_value NUMERIC(38, 8),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_taken VARCHAR(255), -- auto_execute, notify, etc.
    trade_id UUID,
    notification_sent BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_alert_trigger_history_alert_id ON alert_trigger_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_trigger_history_triggered_at ON alert_trigger_history(triggered_at DESC);
