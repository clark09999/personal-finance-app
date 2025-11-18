import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Initialize Neon client lazily. In test environments or when DATABASE_URL
// is not provided we expose a placeholder `db` object so tests can stub
// methods without attempting an actual network connection.
let dbImpl: any = {};

if (env.DATABASE_URL) {
  try {
    const sql = neon(env.DATABASE_URL);
    dbImpl = drizzle(sql);
  } catch (err) {
    logger.error('Failed to initialize database client:', err);
    dbImpl = {};
  }
}

export const db = dbImpl;

// Run migrations
export async function runMigrations() {
  try {
    logger.info('Running database migrations...');
    if (!db) throw new Error('Database not initialized');
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('Migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

// Initialize database connection and run migrations
export async function initDatabase() {
  try {
    // Test connection
    if (!env.DATABASE_URL) {
      logger.info('No DATABASE_URL provided; skipping DB initialization');
      return db;
    }

    const sql = neon(env.DATABASE_URL);
    await sql`SELECT NOW()`;
    logger.info('Database connection established');

    // Run migrations if not in production
    if (env.NODE_ENV !== 'production') {
      await runMigrations();
    }

    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}
