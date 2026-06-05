import type { Elysia } from 'elysia';

import type { app as adminApp } from './apps/admin/server';
import type { app as userApp } from './apps/user/server';

export type AdminApp = typeof adminApp;
export type UserApp = typeof userApp;
export type { Elysia };
