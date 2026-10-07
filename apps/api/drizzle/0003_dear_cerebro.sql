ALTER TABLE "users" ADD COLUMN "username" varchar(50);--> statement-breakpoint
UPDATE "users"
SET "username" = CASE
  WHEN "platform_role" = 'superuser' THEN 'nhernandez'
  ELSE 'user-' || substring("id"::text, 1, 8)
END;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "second_last_name" varchar(140);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_lower_idx" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone") WHERE "users"."phone" is not null;
