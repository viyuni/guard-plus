CREATE EXTENSION IF NOT EXISTS "pgcrypto";--> statement-breakpoint
CREATE FUNCTION "generate_product_nanoid"("target_length" integer DEFAULT 12)
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := '';
  random_bytes bytea;
  byte_index integer;
BEGIN
  WHILE length(result) < target_length LOOP
    random_bytes := gen_random_bytes(target_length);

    FOR byte_index IN 0..octet_length(random_bytes) - 1 LOOP
      result := result || substr(alphabet, (get_byte(random_bytes, byte_index) & 31) + 1, 1);
      EXIT WHEN length(result) = target_length;
    END LOOP;
  END LOOP;

  RETURN result;
END;
$$;--> statement-breakpoint
UPDATE "products"
SET "code" = "generate_product_nanoid"()
WHERE "code" IS NULL;--> statement-breakpoint
DROP FUNCTION "generate_product_nanoid"(integer);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "code" SET NOT NULL;
