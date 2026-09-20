import { fileURLToPath } from 'node:url';

import { migrate as startMigrate } from 'drizzle-orm/bun-sql/postgres/migrator';

import { logger } from '#utils/logger';

import type { DbClient } from './index';

/**
 * 运行数据库迁移
 */
export async function migrate(db: DbClient) {
  logger.info('Running migrations...');

  try {
    await startMigrate(db, {
      migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
    });

    logger.info('Migrations completed!');
  } catch (err) {
    console.error('Migration failed!', err);
    process.exit(1);
  }
}
