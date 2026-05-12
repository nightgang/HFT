-- Initial setup for HFT Trading System Database
-- Role: Create database extensions, audit schema, and bootstrap full schema

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit schema used by the core schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Load the core schema definitions from schema.sql
\set ON_ERROR_STOP on
\i schema.sql

-- Create application role and permissions for the HFT app
DO $$
BEGIN
    CREATE ROLE hft_app_role WITH LOGIN PASSWORD 'change_in_production';
EXCEPTION WHEN DUPLICATE_OBJECT THEN NULL;
END
$$;

GRANT CONNECT ON DATABASE hft_trading TO hft_app_role;
GRANT USAGE ON SCHEMA public TO hft_app_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO hft_app_role;
GRANT SELECT ON ALL TABLES IN SCHEMA audit TO hft_app_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO hft_app_role;
REVOKE INSERT, UPDATE, DELETE ON audit.key_access_logs FROM hft_app_role;

-- Configure database-level session ownership if supported
ALTER DATABASE hft_trading SET "app.current_user" TO 'hft_system';
