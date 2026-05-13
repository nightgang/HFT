-- Initial setup for HFT Trading System Database
-- This file is used for Docker container initialization
-- It sets up extensions, roles, and permissions

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Note: The full schema is loaded via migrations in the application
-- This file only provides the minimal setup for the database to be ready

-- Create application role with minimal permissions
-- Password should be changed in production via environment variables
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'hft_app_role') THEN
        CREATE ROLE hft_app_role WITH LOGIN PASSWORD 'change_in_production';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Role hft_app_role may already exist';
END
$$;

-- Grant basic permissions
GRANT CONNECT ON DATABASE hft_trading TO hft_app_role;
GRANT USAGE ON SCHEMA public TO hft_app_role;
GRANT USAGE ON SCHEMA audit TO hft_app_role;

-- Configure database-level settings
ALTER DATABASE hft_trading SET "app.current_user" TO 'hft_system';
