-- Migration: 001_initial_setup
-- Created: 2024-01-01T00:00:00.000Z
-- Description: Initial database setup with extensions, types, and schemas

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE trade_status AS ENUM ('pending', 'executed', 'failed', 'cancelled', 'partial');
CREATE TYPE trade_direction AS ENUM ('buy', 'sell');
CREATE TYPE risk_violation_type AS ENUM ('daily_loss_limit', 'position_limit', 'correlation_risk', 'slippage_exceeded', 'sandwich_attack', 'other');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed', 'unknown');

-- Create schema for audit logging
CREATE SCHEMA IF NOT EXISTS audit;

-- Enable row-level security
ALTER DATABASE hft_trading SET "app.current_user" TO 'hft_system';