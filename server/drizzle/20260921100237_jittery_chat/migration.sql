ALTER TYPE "bili_event_status" ADD VALUE 'pending' BEFORE 'processing';--> statement-breakpoint
ALTER TABLE "bili_events" ADD COLUMN "claimed_by" text;--> statement-breakpoint
ALTER TABLE "bili_events" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bili_events" ADD COLUMN "lease_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bili_events" ADD COLUMN "next_retry_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bili_events" ADD COLUMN "reward_plan_created_at" timestamp with time zone;--> statement-breakpoint
UPDATE "bili_events"
SET "reward_plan_created_at" = "created_at"
WHERE
	"reward_plan_created_at" IS NULL
	AND "status" <> 'pending'
	AND "claimed_by" IS NULL
	AND "claimed_at" IS NULL
	AND "lease_until" IS NULL;--> statement-breakpoint
UPDATE "bili_events"
SET
	"status" = 'failed',
	"next_retry_at" = now(),
	"last_error_code" = COALESCE("last_error_code", 'WORKER_INTERRUPTED'),
	"last_error_message" = COALESCE("last_error_message", '事件服务升级时恢复未完成任务'),
	"processed_at" = now()
WHERE
	"status" = 'processing'
	AND "claimed_by" IS NULL
	AND "claimed_at" IS NULL
	AND "lease_until" IS NULL;--> statement-breakpoint
CREATE INDEX "bili_events_claim_idx" ON "bili_events" ("status","next_retry_at","lease_until","created_at");
