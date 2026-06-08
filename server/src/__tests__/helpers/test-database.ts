import { createDatabase, type DbClient } from '#db/client';

const testDatabaseUrl = Bun.env.TEST_DATABASE_URL;
const testDatabaseSymbol = Symbol.for('guard-plus.test.database');

type GlobalWithTestDatabase = typeof globalThis & {
  [testDatabaseSymbol]?: DbClient;
};

export function getTestDatabase() {
  if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL is required for database integration tests');
  }

  const globalWithDatabase = globalThis as GlobalWithTestDatabase;

  globalWithDatabase[testDatabaseSymbol] ??= createDatabase(testDatabaseUrl);

  return globalWithDatabase[testDatabaseSymbol];
}

export async function closeTestDatabase() {
  const globalWithDatabase = globalThis as GlobalWithTestDatabase;
  const db = globalWithDatabase[testDatabaseSymbol];

  if (!db) return;

  globalWithDatabase[testDatabaseSymbol] = undefined;
  await db.$client.end();
}
