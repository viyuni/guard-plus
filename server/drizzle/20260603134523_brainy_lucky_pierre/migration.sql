CREATE TYPE "admin_role" AS ENUM('admin', 'superAdmin');--> statement-breakpoint
CREATE TYPE "admin_status" AS ENUM('active', 'banned');--> statement-breakpoint
CREATE TYPE "bili_event_status" AS ENUM('processing', 'succeeded', 'failed', 'ignored');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'completed', 'refunded');--> statement-breakpoint
CREATE TYPE "point_account_status" AS ENUM('active', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "point_transaction_type" AS ENUM('grant', 'consume', 'refund', 'adjust', 'reversal');--> statement-breakpoint
CREATE TYPE "point_type_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "product_delivery_type" AS ENUM('manual', 'automatic');--> statement-breakpoint
CREATE TYPE "reward_product_status" AS ENUM('active', 'reviewing', 'disabled');--> statement-breakpoint
CREATE TYPE "product_stock_movement_type" AS ENUM('consume', 'restore', 'adjust');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('active', 'banned');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"uid" text NOT NULL CONSTRAINT "admins_uid_unique" UNIQUE,
	"username" text NOT NULL,
	"status" "admin_status" DEFAULT 'active'::"admin_status" NOT NULL,
	"role" "admin_role" DEFAULT 'admin'::"admin_role" NOT NULL,
	"password_hash" text NOT NULL,
	"last_login_at" timestamp,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bili_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bili_event_id" text NOT NULL CONSTRAINT "bili_events_event_id_unique" UNIQUE,
	"event_type" text DEFAULT 'biliGuard' NOT NULL,
	"bili_uid" text NOT NULL,
	"user_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"status" "bili_event_status" NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"last_error_message" text,
	"processed_at" timestamp with time zone,
	"event_snapshot" jsonb NOT NULL,
	"reward_item_snapshots" jsonb DEFAULT '[]' NOT NULL,
	"reward_result_snapshots" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_no" text NOT NULL CONSTRAINT "reward_orders_order_no_unique" UNIQUE,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"point_type_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"product_name_snapshot" text NOT NULL,
	"product_delivery_content_snapshot" text,
	"point_type_name_snapshot" text NOT NULL,
	"delivery_type_snapshot" "product_delivery_type" NOT NULL,
	"consume_transaction_id" uuid,
	"refund_transaction_id" uuid,
	"status" "order_status" DEFAULT 'pending'::"order_status" NOT NULL,
	"receiver_phone_encrypted" text,
	"receiver_address_encrypted" text,
	"user_remark" text,
	"refund_reason" text,
	"completed_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"idempotency_key" text NOT NULL,
	"express_company" text,
	"express_no" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"point_type_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"status" "point_account_status" DEFAULT 'active'::"point_account_status" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_conversion_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"remark" text,
	"from_point_type_id" uuid NOT NULL,
	"to_point_type_id" uuid NOT NULL,
	"to_amount" integer NOT NULL,
	"min_convert_amount" integer,
	"max_convert_amount" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"point_type_id" uuid NOT NULL,
	"point_type_name_snapshot" text NOT NULL,
	"type" "point_transaction_type" NOT NULL,
	"delta" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source_type" text,
	"source_id" text,
	"idempotency_key" text NOT NULL,
	"remark" text,
	"metadata" jsonb,
	"reversal_of_transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL UNIQUE,
	"description" text,
	"icon" text,
	"status" "point_type_status" DEFAULT 'active'::"point_type_status" NOT NULL,
	"sort" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_stock_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"type" "product_stock_movement_type" NOT NULL,
	"delta" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"remark" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"cover" text,
	"detail" text,
	"delivery_content" text,
	"point_type_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"status" "reward_product_status" DEFAULT 'disabled'::"reward_product_status" NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"delivery_type" "product_delivery_type" DEFAULT 'manual'::"product_delivery_type" NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"sort" integer,
	"metadata" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"conditions" jsonb NOT NULL,
	"point_type_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"group" text,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"priority" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"bili_uid" text NOT NULL UNIQUE,
	"username" text NOT NULL,
	"status" "user_status" DEFAULT 'active'::"user_status" NOT NULL,
	"password_hash" text NOT NULL,
	"phone_encrypted" text,
	"email_encrypted" text,
	"address_encrypted" text,
	"phone_hash" text,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "admins_single_super_admin_unique" ON "admins" ("role") WHERE "role" = 'superAdmin';--> statement-breakpoint
CREATE INDEX "admins_status_idx" ON "admins" ("status");--> statement-breakpoint
CREATE INDEX "admins_role_idx" ON "admins" ("role");--> statement-breakpoint
CREATE INDEX "admins_uid" ON "admins" ("uid");--> statement-breakpoint
CREATE INDEX "admins_created_at_idx" ON "admins" ("created_at");--> statement-breakpoint
CREATE INDEX "bili_events_bili_uid_idx" ON "bili_events" ("bili_uid");--> statement-breakpoint
CREATE INDEX "bili_events_user_id_idx" ON "bili_events" ("user_id");--> statement-breakpoint
CREATE INDEX "bili_events_status_idx" ON "bili_events" ("status");--> statement-breakpoint
CREATE INDEX "bili_events_occurred_at_idx" ON "bili_events" ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_orders_user_id_idempotency_key_unique" ON "orders" ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "reward_orders_user_id_idx" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX "reward_orders_product_id_idx" ON "orders" ("product_id");--> statement-breakpoint
CREATE INDEX "reward_orders_point_type_id_idx" ON "orders" ("point_type_id");--> statement-breakpoint
CREATE INDEX "reward_orders_status_idx" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX "reward_orders_created_at_idx" ON "orders" ("created_at");--> statement-breakpoint
CREATE INDEX "reward_orders_user_created_at_idx" ON "orders" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "reward_orders_status_created_at_idx" ON "orders" ("status","created_at");--> statement-breakpoint
CREATE INDEX "reward_orders_user_status_created_at_idx" ON "orders" ("user_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "point_accounts_user_id_point_type_id_unique_idx" ON "point_accounts" ("user_id","point_type_id");--> statement-breakpoint
CREATE INDEX "point_accounts_user_id_idx" ON "point_accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "point_accounts_point_type_id_idx" ON "point_accounts" ("point_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "point_conversion_rules_active_unique" ON "point_conversion_rules" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "point_conversion_rules_from_to_unique_idx" ON "point_conversion_rules" ("from_point_type_id","to_point_type_id") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "point_conversion_rules_from_point_type_id_idx" ON "point_conversion_rules" ("from_point_type_id");--> statement-breakpoint
CREATE INDEX "point_conversion_rules_to_point_type_id_idx" ON "point_conversion_rules" ("to_point_type_id");--> statement-breakpoint
CREATE INDEX "point_conversion_rules_enabled_idx" ON "point_conversion_rules" ("enabled");--> statement-breakpoint
CREATE INDEX "point_conversion_rules_time_range_idx" ON "point_conversion_rules" ("start_at","end_at");--> statement-breakpoint
CREATE UNIQUE INDEX "point_transactions_account_id_idempotency_key_unique" ON "point_transactions" ("account_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "point_transactions_reversal_of_transaction_id_unique" ON "point_transactions" ("reversal_of_transaction_id");--> statement-breakpoint
CREATE INDEX "point_transactions_user_id_idx" ON "point_transactions" ("user_id");--> statement-breakpoint
CREATE INDEX "point_transactions_point_account_id_idx" ON "point_transactions" ("account_id");--> statement-breakpoint
CREATE INDEX "point_transactions_point_type_id_idx" ON "point_transactions" ("point_type_id");--> statement-breakpoint
CREATE INDEX "point_transactions_type_idx" ON "point_transactions" ("type");--> statement-breakpoint
CREATE INDEX "point_transactions_source_idx" ON "point_transactions" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "point_transactions_created_at_idx" ON "point_transactions" ("created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_created_at_idx" ON "point_transactions" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_type_created_at_idx" ON "point_transactions" ("user_id","type","created_at");--> statement-breakpoint
CREATE INDEX "point_transactions_user_point_type_created_at_idx" ON "point_transactions" ("user_id","point_type_id","created_at");--> statement-breakpoint
CREATE INDEX "point_types_status_idx" ON "point_types" ("status");--> statement-breakpoint
CREATE INDEX "point_types_sort_idx" ON "point_types" ("sort");--> statement-breakpoint
CREATE UNIQUE INDEX "product_stock_transactions_idempotency_unique" ON "product_stock_transactions" ("product_id","source_type","source_id","type","idempotency_key");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_product_id_idx" ON "product_stock_transactions" ("product_id");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_type_idx" ON "product_stock_transactions" ("type");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_source_idx" ON "product_stock_transactions" ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_created_at_idx" ON "product_stock_transactions" ("created_at");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_product_created_at_idx" ON "product_stock_transactions" ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "product_stock_transactions_product_type_created_at_idx" ON "product_stock_transactions" ("product_id","type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_active_unique" ON "products" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "products_point_type_id_idx" ON "products" ("point_type_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" ("status");--> statement-breakpoint
CREATE INDEX "products_time_range_idx" ON "products" ("start_at","end_at");--> statement-breakpoint
CREATE INDEX "products_sort_idx" ON "products" ("sort");--> statement-breakpoint
CREATE INDEX "products_deleted_at_idx" ON "products" ("deleted_at");--> statement-breakpoint
CREATE INDEX "products_active_list_idx" ON "products" ("status","sort","created_at") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "products_point_type_list_idx" ON "products" ("point_type_id","sort","created_at") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "products_delivery_type_list_idx" ON "products" ("delivery_type","sort","created_at") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE UNIQUE INDEX "reward_rules_active_unique" ON "reward_rules" ("name") WHERE ("deleted_at" is null);--> statement-breakpoint
CREATE INDEX "reward_rules_point_type_id_idx" ON "reward_rules" ("point_type_id");--> statement-breakpoint
CREATE INDEX "reward_rules_enabled_idx" ON "reward_rules" ("enabled");--> statement-breakpoint
CREATE INDEX "reward_rules_group_idx" ON "reward_rules" ("group");--> statement-breakpoint
CREATE INDEX "reward_rules_time_range_idx" ON "reward_rules" ("start_at","end_at");--> statement-breakpoint
CREATE INDEX "reward_rules_priority_idx" ON "reward_rules" ("priority");--> statement-breakpoint
CREATE INDEX "reward_rules_enabled_priority_created_at_idx" ON "reward_rules" ("enabled","priority","created_at");--> statement-breakpoint
CREATE INDEX "reward_rules_priority_created_at_idx" ON "reward_rules" ("priority","created_at");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" ("status");--> statement-breakpoint
CREATE INDEX "users_bili_uid_idx" ON "users" ("bili_uid");--> statement-breakpoint
CREATE INDEX "users_phone_hash_idx" ON "users" ("phone_hash");--> statement-breakpoint
ALTER TABLE "bili_events" ADD CONSTRAINT "bili_events_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_consume_transaction_id_point_transactions_id_fkey" FOREIGN KEY ("consume_transaction_id") REFERENCES "point_transactions"("id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_refund_transaction_id_point_transactions_id_fkey" FOREIGN KEY ("refund_transaction_id") REFERENCES "point_transactions"("id");--> statement-breakpoint
ALTER TABLE "point_accounts" ADD CONSTRAINT "point_accounts_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "point_conversion_rules" ADD CONSTRAINT "point_conversion_rules_from_point_type_id_point_types_id_fkey" FOREIGN KEY ("from_point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "point_conversion_rules" ADD CONSTRAINT "point_conversion_rules_to_point_type_id_point_types_id_fkey" FOREIGN KEY ("to_point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_account_id_point_accounts_id_fkey" FOREIGN KEY ("account_id") REFERENCES "point_accounts"("id");--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "product_stock_transactions" ADD CONSTRAINT "product_stock_transactions_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");--> statement-breakpoint
ALTER TABLE "reward_rules" ADD CONSTRAINT "reward_rules_point_type_id_point_types_id_fkey" FOREIGN KEY ("point_type_id") REFERENCES "point_types"("id");