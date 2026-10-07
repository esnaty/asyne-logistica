ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "primary_color" varchar(7) DEFAULT '#2563EB' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;