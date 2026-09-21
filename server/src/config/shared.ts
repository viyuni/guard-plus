import * as v from 'valibot';

const nodeEnv = v.optional(v.picklist(['development', 'production', 'test']), 'development');

/** 跨 App 共享的环境变量 Schema 片段。 */
export const sharedEnv = {
  NODE_ENV: nodeEnv,
  LOG_LEVEL: v.optional(v.picklist(['debug', 'info', 'warn', 'error']), 'info'),
  DATA_SECRET: v.string(),
};

export type NodeEnv = v.InferOutput<typeof nodeEnv>;
