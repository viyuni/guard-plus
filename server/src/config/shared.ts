import * as v from 'valibot';

const nodeEnv = v.optional(v.picklist(['development', 'production', 'test']), 'development');

/** 跨 App 共享的环境变量 Schema 片段。 */
export const sharedEnv = {
  NODE_ENV: nodeEnv,
  LOG_LEVEL: v.optional(v.picklist(['debug', 'info', 'warn', 'error']), 'info'),
  LOG_DIRECTORY: v.optional(v.string()),
  LOG_MAX_SIZE_MB: v.optional(
    v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1)),
    '20',
  ),
  LOG_MAX_FILES: v.optional(
    v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(2)),
    '10',
  ),
  DATA_SECRET: v.string(),
};

export type NodeEnv = v.InferOutput<typeof nodeEnv>;
