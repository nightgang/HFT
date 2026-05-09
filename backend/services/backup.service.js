const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.backupJob = null;
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 7;
  }

  async performBackup() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `hft-db-backup-${timestamp}.dump`;
      const filePath = path.join(this.backupDir, fileName);

      const databaseUrl = process.env.DATABASE_URL || this.buildDatabaseUrl();
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is required to create database backups');
      }

      const command = `pg_dump --format=c --no-owner --no-privileges "${databaseUrl}" -f "${filePath}"`;
      logger.info(`Running backup command: ${command}`);

      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            logger.error('Backup command failed:', stderr || error.message);
            return reject(error);
          }
          logger.info(`Backup created at ${filePath}`);
          resolve();
        });
      });

      await this.cleanupOldBackups();
      return { success: true, filePath, fileName };
    } catch (error) {
      logger.error('Database backup failed:', error);
      return { success: false, error: error.message };
    }
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const expiration = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;

      await Promise.all(files.map(async (file) => {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() < expiration) {
          await fs.unlink(filePath);
          logger.info(`Removed expired backup file: ${file}`);
        }
      }));
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
    }
  }

  buildDatabaseUrl() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    const database = process.env.DB_NAME || 'hft_trading';
    const user = process.env.DB_USER || 'hft_user';
    const password = process.env.DB_PASSWORD || 'hft_secure_password_change_in_production';

    if (!host || !port || !database || !user || !password) {
      return null;
    }

    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);

    const url = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
    logger.info('Derived DATABASE_URL from DB_* environment variables');
    return url;
  }

  async hasPgDump() {
    return new Promise((resolve) => {
      exec('command -v pg_dump', (error) => {
        resolve(!error);
      });
    });
  }

  async startScheduledBackups() {
    if (this.backupJob) {
      return;
    }

    if (!(await this.hasPgDump())) {
      logger.warn('pg_dump is not installed; database backups are disabled until pg_dump is available.');
      return;
    }

    this.backupJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Starting scheduled database backup');
      await this.performBackup();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    logger.info('Scheduled database backups at 02:00 UTC daily');
    return this.performBackup();
  }
}

module.exports = new BackupService();
