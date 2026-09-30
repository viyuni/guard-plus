import { type Dependency, ripple } from 'cyrenex';
import { drizzle } from 'drizzle-orm/bun-sql';

import { DatabaseUrl } from '#config';

import { relations } from './relations.ts';

export function createDatabase(connection: string) {
  return drizzle(connection, {
    relations,
  });
}

export type DbClient = ReturnType<typeof createDatabase>;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type DbExecutor = DbClient | DbTransaction;

/** 数据库客户端; 容器拥有并在停止时释放底层连接。 */
export const Database: Dependency<DbClient, { DatabaseUrl: Dependency<string, {}, false> }, false> =
  ripple(
    'Database',
    {
      DatabaseUrl,
    },
    ({ DatabaseUrl }) => {
      const db = createDatabase(DatabaseUrl);

      return Object.assign(db, {
        [Symbol.asyncDispose]: () => db.$client.end(),
      });
    },
  );
