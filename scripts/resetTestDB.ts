#!/usr/bin/env tsx
import { env } from '../server/config/env';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { logger } from '../server/utils/logger';

async function reset() {
  if (!env.DATABASE_URL) {
    console.error('Missing DATABASE_URL. Set it before running this script.');
    process.exit(1);
  }

  // Try Neon (serverless) client first; fall back to node-postgres for CI/local Postgres
  try {
    logger.info('Resetting test database...');
    if (env.DATABASE_URL.startsWith('postgres://') || env.DATABASE_URL.startsWith('postgresql://')) {
      // Use node-postgres when a standard Postgres URL is provided (CI local Postgres)
      const { Client } = await import('pg');
      const client = new Client({ connectionString: env.DATABASE_URL });
      await client.connect();
      await client.query('TRUNCATE TABLE budgets, goals, transactions, categories, users RESTART IDENTITY CASCADE');
      await client.end();
      logger.info('Test database reset complete (pg client).');
      process.exit(0);
    } else {
      // Default to Neon serverless client
      const client = neon(env.DATABASE_URL);
      const db = drizzle(client);
      // Truncate in the correct order to respect FKs
      await db.execute(sql`TRUNCATE TABLE budgets, goals, transactions, categories, users RESTART IDENTITY CASCADE`);
      logger.info('Test database reset complete (neon).');
      process.exit(0);
    }
  } catch (err) {
    console.error('Failed to reset test DB:', err);
    process.exit(2);
  }
}

reset();
