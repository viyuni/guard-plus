import * as v from 'valibot';

/** 图片存储环境变量 Schema 片段。 */
export const imageEnv = {
  IMAGE_SAVE_PATH: v.optional(v.string()),
};
