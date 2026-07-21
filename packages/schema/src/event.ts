import * as v from 'valibot';

const NullableTimestampSchema = v.nullable(v.number());

const ErrorStatusSchema = v.object({
  name: v.string(),
  message: v.string(),
});

const HeartbeatStatusSchema = v.object({
  id: v.string(),
  message: v.string(),
  success: v.boolean(),
  startedAt: v.number(),
  completedAt: v.number(),
  durationMs: v.number(),
  error: v.nullable(ErrorStatusSchema),
});

const ListenerStatusSchema = v.object({
  instanceId: v.string(),
  roomId: v.number(),
  status: v.picklist(['idle', 'connecting', 'connected', 'reconnecting', 'failed', 'stopped']),
  retryCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  lastStatusChangedAt: v.number(),
  connectedAt: NullableTimestampSchema,
  stoppedAt: NullableTimestampSchema,
  login: v.object({
    status: v.picklist(['unknown', 'loggedIn', 'loggedOut', 'error']),
    uid: v.number(),
    checkedAt: NullableTimestampSchema,
    invalidSince: NullableTimestampSchema,
  }),
  lastHeartbeat: v.nullable(HeartbeatStatusSchema),
  lastError: v.nullable(
    v.object({
      name: v.string(),
      message: v.string(),
      at: v.number(),
    }),
  ),
});

export const EventServiceStatusSchema = v.object({
  service: v.literal('event-server'),
  healthy: v.boolean(),
  listener: v.nullable(ListenerStatusSchema),
});

export type EventServiceStatus = v.InferOutput<typeof EventServiceStatusSchema>;
