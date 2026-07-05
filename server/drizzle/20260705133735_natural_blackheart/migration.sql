ALTER TABLE "products" ADD COLUMN "code" text;--> statement-breakpoint
CREATE UNIQUE INDEX "products_code_unique" ON "products" ("code");