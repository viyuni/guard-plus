import path from 'node:path';

import { createEnv } from '@t3-oss/env-core';
import * as v from 'valibot';

export const imageEnv = createEnv({
  server: {
    /**
     * 存储图片的路径
     */
    IMAGE_SAVE_PATH: v.optional(v.string(), path.join(process.cwd(), 'public', 'images')),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type ImageEnv = typeof imageEnv;
