import { drizzle } from 'drizzle-orm/bun-sql';

import { relations } from './relations.ts';

export function createDatabase(connection: string) {
  return drizzle(connection, {
    relations,
  });
}

export type DbClient = ReturnType<typeof createDatabase>;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type DbExecutor = DbClient | DbTransaction;
