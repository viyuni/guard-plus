UPDATE "products"
SET "code" = substring(
  translate(
    encode(decode(md5("id"::text || clock_timestamp()::text || random()::text), 'hex'), 'base64'),
    'abcdefghijklmnopqrstuvwxyz/+',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ01'
  ),
  1,
  8
)
WHERE "code" IS NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "code" SET NOT NULL;
