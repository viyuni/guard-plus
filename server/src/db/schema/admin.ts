import { eq, type InferEnum, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers.ts';

export const adminStatusEnum = pgEnum('admin_status', ['active', 'banned']);
export const adminRoleEnum = pgEnum('admin_role', ['admin', 'superAdmin']);

/** 管理员表 */
export const admins = pgTable(
  'admins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    uid: text('uid').notNull().unique('admins_uid_unique'),
    username: text('username').notNull(),
    status: adminStatusEnum('status').notNull().default('active'),
    role: adminRoleEnum('role').notNull().default('admin'),
    passwordHash: text('password_hash').notNull(),
    lastLoginAt: timestamp('last_login_at'),
    remark: text('remark'),
    ...timestamps,
  },
  t => [
    uniqueIndex('admins_single_super_admin_unique').on(t.role).where(eq(t.role, 'superAdmin')),
    index('admins_status_idx').on(t.status),
    index('admins_role_idx').on(t.role),
    index('admins_uid').on(t.uid),
    index('admins_created_at_idx').on(t.createdAt),
  ],
);

export type AdminStatus = InferEnum<typeof adminStatusEnum>;
export type AdminRole = InferEnum<typeof adminRoleEnum>;
export type Admin = InferSelectModel<typeof admins>;
export type InsertAdmin = InferInsertModel<typeof admins>;
export type UpdateAdmin = Partial<InsertAdmin>;
