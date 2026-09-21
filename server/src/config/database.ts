import * as v from 'valibot';

/** 数据库环境变量 Schema 片段。 */
export const databaseEnv = {
  DATABASE_URL: v.string(),
};
