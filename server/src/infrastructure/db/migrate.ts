import { fileURLToPath } from 'node:url';

import { migrate as startMigrate } from 'drizzle-orm/bun-sql/postgres/migrator';

import type { AppLogger } from '#infrastructure/logger';

import type { DbClient } from './index';

/**
 * 运行数据库迁移
 */
export async function migrate(db: DbClient, logger: Pick<AppLogger, 'info'>) {
  logger.info('Running migrations...');

  await startMigrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url)),
  });

  logger.info('Migrations completed!');
}
