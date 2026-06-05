import type { InferEnum, InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';

export const userStatusEnum = pgEnum('user_status', ['active', 'banned']);

/**
 * 用户表
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    biliUid: text('bili_uid').notNull().unique(),
    username: text('username').notNull(),
    status: userStatusEnum('status').notNull().default('active'),
    passwordHash: text('password_hash').notNull(),
    phoneEncrypted: text('phone_encrypted'),
    emailEncrypted: text('email_encrypted'),
    addressEncrypted: text('address_encrypted'),
    phoneHash: text('phone_hash'),
    remark: text('remark'),
    ...timestamps,
  },
  t => [
    index('users_status_idx').on(t.status),
    index('users_bili_uid_idx').on(t.biliUid),
    index('users_phone_hash_idx').on(t.phoneHash),
  ],
);

export type UserStatus = InferEnum<typeof userStatusEnum>;
export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
export type UpdateUser = Partial<InsertUser>;
