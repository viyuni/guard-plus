import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import { pointTypes } from './point-type';
import { users } from './user';

/** 旧平台待回放积分。 */
export const legacyPointMigrations = pgTable(
  'legacy_point_migrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    biliUid: text('bili_uid').notNull(),
    pointTypeId: uuid('point_type_id')
      .notNull()
      .references(() => pointTypes.id, { onDelete: 'cascade' }),
    points: integer('points').notNull(),
    replayedUserId: uuid('replayed_user_id').references(() => users.id, { onDelete: 'set null' }),
    replayedAt: timestamp('replayed_at', { withTimezone: true }),
    ...timestamps,
  },
  t => [
    index('legacy_point_migrations_bili_uid_replayed_at_idx').on(t.biliUid, t.replayedAt),
    index('legacy_point_migrations_point_type_id_idx').on(t.pointTypeId),
  ],
);

export type LegacyPointMigration = InferSelectModel<typeof legacyPointMigrations>;
export type InsertLegacyPointMigration = InferInsertModel<typeof legacyPointMigrations>;
