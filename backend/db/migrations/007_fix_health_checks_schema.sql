-- Migration: Fix health_checks schema - add missing details column

-- Add details column to health_checks table if it doesn't exist
ALTER TABLE IF EXISTS health_checks
ADD COLUMN IF NOT EXISTS details JSONB;

-- Update column name from check_id to health_check_id for consistency with migration 003
-- Note: This is a non-breaking change as the primary key will still be the UUID

-- Record migration
INSERT INTO schema_migrations (migration_name, success)
VALUES ('006_fix_health_checks_schema', true)
ON CONFLICT DO NOTHING;
