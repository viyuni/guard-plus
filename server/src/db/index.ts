import { dbEnv } from '#env/db';

import { createDatabase } from './client';

export const db = createDatabase(dbEnv.DATABASE_URL);

export { createDatabase };
export type { DbClient, DbExecutor, DbTransaction } from './client';
