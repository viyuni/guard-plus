// This file is only preloaded by the test script. Keep required runtime env
// explicit here so tests do not depend on a developer's shell environment.
import { mkdirSync } from 'node:fs';

Bun.env.NODE_ENV = 'test';
Bun.env.DATABASE_URL ??= Bun.env.TEST_DATABASE_URL;
Bun.env.DATA_SECRET ??= 'test-data-secret-test-data-secret';
Bun.env.ADMIN_JWT_SECRET ??= 'test-admin-jwt-secret';
Bun.env.USER_JWT_SECRET ??= 'test-user-jwt-secret';
Bun.env.JWT_SECRET ??= 'test-jwt-secret';
Bun.env.IMAGE_SAVE_PATH ??= './tmp/test-images';
Bun.env.PORT ??= '0';

mkdirSync(Bun.env.IMAGE_SAVE_PATH, { recursive: true });
