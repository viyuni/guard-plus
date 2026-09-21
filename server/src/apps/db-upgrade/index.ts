import { createDatabase, upgradeBiliEventJobs } from '#infrastructure/db';
import { createLogger } from '#infrastructure/logger';

const databaseUrl = Bun.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to upgrade the database');
}

const logger = createLogger({
  level: Bun.env.LOG_LEVEL ?? 'info',
  pretty: Bun.env.NODE_ENV !== 'production',
});

const db = createDatabase(databaseUrl);

try {
  const result = await upgradeBiliEventJobs(db);

  logger.info(result, 'Database data upgrade completed');
} finally {
  await db.$client.end();
}
