import { fileURLToPath } from 'node:url';

import { migrate as startMigrate } from 'drizzle-orm/bun-sql/postgres/migrator';

import type { DbClient } from './index';

/**
 * 运行数据库迁移
 */
export async function migrate(db: DbClient) {
  console.log('Running migrations...');

  try {
    await startMigrate(db, {
      migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)),
    });

    console.log('Migrations completed!');
  } catch (err) {
    console.error('Migration failed!', err);
    process.exit(1);
  }
}
