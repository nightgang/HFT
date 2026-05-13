# Database Layer

This directory contains the database schema, migrations, and initialization scripts for the HFT Trading System.

## Structure

- `init.sql` - Initial database setup for Docker containers
- `schema.sql` - Complete database schema reference (for documentation)
- `migrate.js` - Node.js migration runner script
- `migrations/` - Incremental database migration files

## Usage

### Running Migrations

```bash
# Run all pending migrations
node migrate.js migrate

# Check migration status
node migrate.js status

# Create new migration
node migrate.js create <migration_name>

# Reset database (WARNING: drops all data)
node migrate.js reset
```

### Migration Files

Migration files should be named with timestamp: `YYYY-MM-DD-HH-MM-SS_description.sql`

Example:
```sql
-- Migration: add_new_feature
-- Created: 2024-01-01T12:00:00.000Z
-- Description: Add new feature table

-- Your SQL here
CREATE TABLE new_feature (...);
```

## Database Configuration

Set the following environment variables:

- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name (default: hft_trading)
- `DB_USER` - Database user (default: hft_user)
- `DB_PASSWORD` - Database password (required)

## Schema Overview

The database consists of:

- **Wallets & Accounts** - Wallet management and balances
- **Trading History** - Trade records and performance
- **Risk Management** - Risk rules and violations
- **Audit Logging** - System audit trails
- **Monitoring** - Health checks and metrics

See `schema.sql` for complete table definitions.