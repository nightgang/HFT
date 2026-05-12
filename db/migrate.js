#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const logger = require('../backend/utils/logger');

// Database configuration (same as backend)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hft_trading',
  user: process.env.DB_USER || 'hft_user',
  password: process.env.DB_PASSWORD,
  max: 5, // Lower for migrations
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

class DatabaseMigrator {
  constructor() {
    this.migrations = [];
    this.migrationDir = path.join(__dirname, 'migrations');
  }

  async connect() {
    try {
      await pool.connect();
      logger.info('Connected to database for migrations');
      return true;
    } catch (error) {
      logger.error('Failed to connect to database:', error.message);
      return false;
    }
  }

  async disconnect() {
    await pool.end();
    logger.info('Disconnected from database');
  }

  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await pool.query(query);
      logger.info('Migrations table created/verified');
    } catch (error) {
      logger.error('Failed to create migrations table:', error.message);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await pool.query('SELECT version FROM schema_migrations ORDER BY version');
      return result.rows.map(row => row.version);
    } catch (error) {
      logger.error('Failed to get executed migrations:', error.message);
      return [];
    }
  }

  async loadMigrations() {
    if (!fs.existsSync(this.migrationDir)) {
      fs.mkdirSync(this.migrationDir, { recursive: true });
      logger.info('Created migrations directory');
      return;
    }

    const files = fs.readdirSync(this.migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    this.migrations = files.map(file => ({
      version: path.parse(file).name,
      name: file,
      path: path.join(this.migrationDir, file)
    }));

    logger.info(`Found ${this.migrations.length} migration files`);
  }

  async executeMigration(migration) {
    const sql = fs.readFileSync(migration.path, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Execute the migration
      await client.query(sql);

      // Record the migration
      await client.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.name]
      );

      await client.query('COMMIT');
      logger.info(`✅ Executed migration: ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`❌ Failed to execute migration ${migration.name}:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async migrate() {
    const executed = await this.getExecutedMigrations();
    const pending = this.migrations.filter(m => !executed.includes(m.version));

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Executing ${pending.length} pending migrations...`);

    for (const migration of pending) {
      await this.executeMigration(migration);
    }

    logger.info('All migrations completed successfully');
  }

  async status() {
    const executed = await this.getExecutedMigrations();

    console.log('\n📊 Migration Status:');
    console.log('=' .repeat(50));

    this.migrations.forEach(migration => {
      const status = executed.includes(migration.version) ? '✅' : '⏳';
      console.log(`${status} ${migration.version} - ${migration.name}`);
    });

    console.log(`\nTotal: ${this.migrations.length}, Executed: ${executed.length}, Pending: ${this.migrations.length - executed.length}`);
  }

  async createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationDir, filename);

    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add your migration description here

-- Add your SQL statements here

`;

    fs.writeFileSync(filepath, template);
    logger.info(`Created migration file: ${filename}`);
  }

  async reset() {
    logger.warn('⚠️  Resetting database - this will drop all data!');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Drop all tables in reverse dependency order
      const tables = [
        'trade_events', 'trade_details', 'trades', 'wallet_performance', 'wallet_balances',
        'risk_violations', 'risk_rules', 'blocked_tokens', 'system_metrics', 'health_checks',
        'api_call_logs', 'websocket_sessions', 'wallets', 'audit.configuration_changes',
        'audit.error_logs', 'audit.key_access_logs', 'schema_migrations'
      ];

      for (const table of tables) {
        try {
          await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        } catch (error) {
          logger.warn(`Could not drop ${table}:`, error.message);
        }
      }

      // Drop schema
      try {
        await client.query('DROP SCHEMA IF EXISTS audit CASCADE');
      } catch (error) {
        logger.warn('Could not drop audit schema:', error.message);
      }

      // Drop types
      const types = ['trade_status', 'trade_direction', 'risk_violation_type', 'transaction_status'];
      for (const type of types) {
        try {
          await client.query(`DROP TYPE IF EXISTS ${type}`);
        } catch (error) {
          logger.warn(`Could not drop type ${type}:`, error.message);
        }
      }

      await client.query('COMMIT');
      logger.info('Database reset completed');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to reset database:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const migrator = new DatabaseMigrator();

  if (!await migrator.connect()) {
    process.exit(1);
  }

  try {
    await migrator.createMigrationsTable();
    await migrator.loadMigrations();

    switch (command) {
      case 'up':
      case 'migrate':
        await migrator.migrate();
        break;
      case 'status':
        await migrator.status();
        break;
      case 'create':
        const name = args[1];
        if (!name) {
          console.error('Usage: node migrate.js create <migration_name>');
          process.exit(1);
        }
        await migrator.createMigration(name);
        break;
      case 'reset':
        await migrator.reset();
        break;
      default:
        console.log('Usage: node migrate.js <command>');
        console.log('Commands:');
        console.log('  migrate/up  - Run pending migrations');
        console.log('  status      - Show migration status');
        console.log('  create      - Create new migration file');
        console.log('  reset       - Reset database (WARNING: drops all data)');
        break;
    }
  } finally {
    await migrator.disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseMigrator;