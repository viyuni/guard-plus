import { sql, type InferEnum, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { timestamps } from './column-helpers';
import type { PointType } from './point-type';
import type { RewardRule } from './reward-rules';
import { users } from './user';

export const biliEventStatusEnum = pgEnum('bili_event_status', [
  'processing',
  'succeeded',
  'failed',
  'ignored',
]);

export interface BiliEventRewardItemSnapshot {
  ruleSnapshot: RewardRule;
  pointTypeSnapshot: PointType;
  pointTypeId: string;
  points: number;
}

export interface BiliEventRewardResultSnapshot {
  ruleId: string;
  pointTypeId: string;
  points: number;
  transactionId: string;
  duplicated: boolean;
}

export const biliEvents = pgTable(
  'bili_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    biliEventId: text('bili_event_id').notNull().unique('bili_events_event_id_unique'),
    eventType: text('event_type')
      .notNull()
      .default('biliGuard')
      .$type<'biliGuard' | ({} & string)>(),
    biliUid: text('bili_uid').notNull(),
    userId: uuid('user_id').references(() => users.id),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    status: biliEventStatusEnum('status').notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    lastErrorCode: text('last_error_code'),
    lastErrorMessage: text('last_error_message'),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    eventSnapshot: jsonb('event_snapshot').notNull(),
    rewardItemSnapshots: jsonb('reward_item_snapshots')
      .notNull()
      .$type<BiliEventRewardItemSnapshot[]>()
      .default(sql`'[]'::jsonb`),
    rewardResultSnapshots: jsonb('reward_result_snapshots')
      .notNull()
      .$type<BiliEventRewardResultSnapshot[]>()
      .default(sql`'[]'::jsonb`),

    ...timestamps,
  },
  t => [
    index('bili_events_bili_uid_idx').on(t.biliUid),
    index('bili_events_user_id_idx').on(t.userId),
    index('bili_events_status_idx').on(t.status),
    index('bili_events_occurred_at_idx').on(t.occurredAt),
  ],
);

export type BiliEventStatus = InferEnum<typeof biliEventStatusEnum>;
export type BiliEvent = InferSelectModel<typeof biliEvents>;
export type InsertBiliEvent = InferInsertModel<typeof biliEvents>;
export type UpdateBiliEvent = Partial<InsertBiliEvent>;
