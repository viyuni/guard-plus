import * as v from 'valibot';

export const EventServiceCheckResultSchema = v.object({
  probeId: v.string(),
  healthy: v.boolean(),
});

export type EventServiceCheckResult = v.InferOutput<typeof EventServiceCheckResultSchema>;
