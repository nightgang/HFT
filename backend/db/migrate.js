const fs = require('fs');
const path = require('path');
// Load environment variables FIRST
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { query } = require('./connection');
const logger = require('../utils/logger');

class DatabaseMigrator {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  // Get list of migration files
  getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      return files;
    } catch (error) {
      logger.error('Error reading migration files:', error);
      return [];
    }
  }

  // Check if migration has been executed
  async isMigrationExecuted(migrationName) {
    try {
      const result = await query(
        'SELECT migration_id FROM schema_migrations WHERE migration_name = $1',
        [migrationName]
      );
      return result.rows.length > 0;
    } catch (error) {
      // If table doesn't exist, assume no migrations executed
      if (error.code === '42P01') { // undefined_table
        return false;
      }
      throw error;
    }
  }

  // Execute a single migration
  async executeMigration(migrationFile) {
    const migrationName = path.parse(migrationFile).name;
    const migrationPath = path.join(this.migrationsPath, migrationFile);

    try {
      // Check if already executed
      const executed = await this.isMigrationExecuted(migrationName);
      if (executed) {
        logger.info(`Migration ${migrationName} already executed, skipping`);
        return true;
      }

      // For initial schema migration, check if schema already exists (from init.sql)
      if (migrationName === '001_initial_schema') {
        try {
          const schemaExists = await this.checkSchemaExists();
          if (schemaExists) {
            logger.info(`Schema already exists (from init.sql), marking migration ${migrationName} as executed`);
            await this.markMigrationExecuted(migrationName);
            return true;
          }
        } catch (error) {
          logger.warn('Error checking schema existence:', error);
        }
      }

      // Read migration file
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Execute migration
      logger.info(`Executing migration: ${migrationName}`);
      await query(sql);

      // Record successful migration
      await query(
        `INSERT INTO schema_migrations (migration_name, success)
         VALUES ($1, $2)
         ON CONFLICT (migration_name)
         DO UPDATE SET success = EXCLUDED.success, error_message = NULL, executed_at = NOW()`,
        [migrationName, true]
      );

      logger.info(`Migration ${migrationName} executed successfully`);
      return true;
    } catch (error) {
      logger.error(`Migration ${migrationName} failed:`, error);

      // Record failed migration
      try {
        await query(
          `INSERT INTO schema_migrations (migration_name, success, error_message)
           VALUES ($1, $2, $3)
           ON CONFLICT (migration_name)
           DO UPDATE SET success = EXCLUDED.success, error_message = EXCLUDED.error_message, executed_at = NOW()`,
          [migrationName, false, error.message]
        );
      } catch (recordError) {
        logger.error('Failed to record migration error:', recordError);
      }

      return false;
    }
  }

  // Check if schema already exists
  async checkSchemaExists() {
    try {
      const result = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallets'");
      return result.rows.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Mark migration as executed without running it
  async markMigrationExecuted(migrationName) {
    try {
      await query(
        `INSERT INTO schema_migrations (migration_name, success)
         VALUES ($1, $2)
         ON CONFLICT (migration_name)
         DO UPDATE SET success = EXCLUDED.success, error_message = NULL, executed_at = NOW()`,
        [migrationName, true]
      );
    } catch (error) {
      logger.error('Failed to mark migration as executed:', error);
    }
  }

  // Run all pending migrations
  async runMigrations() {
    logger.info('Starting database migrations...');

    const migrationFiles = this.getMigrationFiles();
    if (migrationFiles.length === 0) {
      logger.info('No migration files found');
      return true;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const file of migrationFiles) {
      const success = await this.executeMigration(file);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    logger.info(`Migrations completed: ${successCount} successful, ${failureCount} failed`);

    if (failureCount > 0) {
      logger.error('Some migrations failed. Please check the logs and fix issues before proceeding.');
      return false;
    }

    return true;
  }

  // Get migration status
  async getMigrationStatus() {
    try {
      const result = await query(
        'SELECT migration_name, executed_at, success, error_message FROM schema_migrations ORDER BY executed_at DESC'
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting migration status:', error);
      return [];
    }
  }
}

// CLI interface
async function main() {
  const migrator = new DatabaseMigrator();

  if (process.argv[2] === 'status') {
    const status = await migrator.getMigrationStatus();
    console.table(status);
  } else {
    const success = await migrator.runMigrations();
    process.exit(success ? 0 : 1);
  }
}

// Export for use in other modules
module.exports = DatabaseMigrator;

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Migration error:', error);
    process.exit(1);
  });
}