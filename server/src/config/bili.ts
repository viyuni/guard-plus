import * as v from 'valibot';

const numberish = () => v.pipe(v.union([v.string(), v.number()]), v.transform(Number));

/** Bilibili 环境变量 Schema 片段。 */
export const biliEnv = {
  BILI_ROOM: v.pipe(v.string(), v.toNumber()),
  BILI_REGISTER_CODE_TTL_SECONDS: v.optional(numberish(), 300),
};
