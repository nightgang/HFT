-- Migration: Add Notification Tables

-- User notifications storage
CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
    preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    email_address VARCHAR(255),
    phone_number VARCHAR(50),
    do_not_disturb_start TIME,
    do_not_disturb_end TIME,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
