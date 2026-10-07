CREATE TYPE "public"."platform_role" AS ENUM('user', 'superuser');--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_active_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "active_organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "platform_role" "platform_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_organizations_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;