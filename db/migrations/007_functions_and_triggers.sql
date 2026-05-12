-- Migration: 007_functions_and_triggers
-- Created: 2024-01-01T00:06:00.000Z
-- Description: Create database functions, triggers, and views

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_update_timestamp
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallet_timestamp();

-- Update trade timestamp
CREATE OR REPLACE FUNCTION update_trade_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trades_update_timestamp
BEFORE UPDATE ON trades
FOR EACH ROW
EXECUTE FUNCTION update_trade_timestamp();

-- Log trade events automatically
CREATE OR REPLACE FUNCTION log_trade_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO trade_events (trade_id, event_type, event_data)
    VALUES (
        NEW.trade_id,
        'status_change',
        jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'timestamp', CURRENT_TIMESTAMP
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trades_log_events
AFTER UPDATE ON trades
FOR EACH ROW
EXECUTE FUNCTION log_trade_event();