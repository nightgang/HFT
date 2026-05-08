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

      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required to create database backups');
      }

      const command = `pg_dump --format=c --no-owner --no-privileges "${process.env.DATABASE_URL}" -f "${filePath}"`;
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

  async startScheduledBackups() {
    if (this.backupJob) {
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
