CREATE TABLE "legacy_point_migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bili_uid" text NOT NULL,
	"point_type_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"replayed_user_id" uuid,
	"replayed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "code" text;--> statement-breakpoint
CREATE INDEX "legacy_point_migrations_bili_uid_replayed_at_idx" ON "legacy_point_migrations" ("bili_uid","replayed_at");--> statement-breakpoint
CREATE INDEX "legacy_point_migrations_point_type_id_idx" ON "legacy_point_migrations" ("point_type_id");--> statement-breakpoint
ALTER TABLE "legacy_point_migrations" ADD CONSTRAINT "legacy_point_migrations_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "legacy_point_migrations" ADD CONSTRAINT "legacy_point_migrations_replayed_user_id_users_id_fkey" FOREIGN KEY ("replayed_user_id") REFERENCES "users"("id");
