import { S3 } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export class BackupService {
  private s3: S3;
  private readonly BACKUP_PATH = '/tmp/neondb_backup.sql';

  constructor() {
    this.s3 = new S3({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });
  }

  async createBackup(): Promise<void> {
    try {
      logger.info('Starting database backup...');

      // Create pg_dump command
      const dumpCommand = `pg_dump "${env.DATABASE_URL}" > ${this.BACKUP_PATH}`;
      
      // Execute pg_dump
      await execAsync(dumpCommand);
      logger.info('Database dump created successfully');

      // Upload to S3
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const key = `backups/${timestamp}.sql`;

      await this.s3.putObject({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: createReadStream(this.BACKUP_PATH),
        ContentType: 'application/sql',
      });

      logger.info(`Backup uploaded to S3: ${key}`);

      // Clean up local file
      await execAsync(`rm ${this.BACKUP_PATH}`);
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const response = await this.s3.listObjects({
        Bucket: env.S3_BUCKET,
        Prefix: 'backups/',
      });

      return (response.Contents || [])
        .map(obj => obj.Key!)
        .filter(key => key.endsWith('.sql'));
    } catch (error) {
      logger.error('Failed to list backups:', error);
      throw error;
    }
  }

  async restoreBackup(key: string): Promise<void> {
    try {
      logger.info(`Starting restore from backup: ${key}`);

      // Download backup from S3
      const response = await this.s3.getObject({
        Bucket: env.S3_BUCKET,
        Key: key,
      });

      // Save to temp file
      const restorePath = '/tmp/neondb_restore.sql';
      await promisify(require('fs').writeFile)(
        restorePath,
        await response.Body?.transformToString()
      );

      // Restore database
      const restoreCommand = `psql "${env.DATABASE_URL}" < ${restorePath}`;
      await execAsync(restoreCommand);

      logger.info('Database restored successfully');

      // Clean up
      await execAsync(`rm ${restorePath}`);
    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }
}

export const backupService = new BackupService();
