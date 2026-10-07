CREATE TABLE "roles" (
	"scope" varchar(20) NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(80) NOT NULL,
	"sort_order" varchar(4) NOT NULL,
	CONSTRAINT "roles_scope_code_pk" PRIMARY KEY("scope","code")
);
--> statement-breakpoint
INSERT INTO "roles" ("scope", "code", "name", "sort_order") VALUES
	('global', 'user', 'Usuario', '010'),
	('global', 'admin', 'Administrador', '020'),
	('global', 'superuser', 'Superusuario', '030'),
	('company', 'owner', 'Propietario', '010'),
	('company', 'admin', 'Administrador', '020'),
	('company', 'planner', 'Planificador', '030'),
	('company', 'warehouse', 'Almacén', '040'),
	('company', 'driver', 'Conductor', '050');
--> statement-breakpoint
ALTER TABLE "organization_memberships" RENAME COLUMN "role" TO "role_code";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "platform_role" TO "platform_role_code";--> statement-breakpoint
ALTER TABLE "organization_memberships" ALTER COLUMN "role_code" TYPE varchar(40) USING "role_code"::text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "platform_role_code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "platform_role_code" TYPE varchar(40) USING "platform_role_code"::text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "platform_role_code" SET DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD COLUMN "role_scope" varchar(20) DEFAULT 'company' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "platform_role_scope" varchar(20) DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "memberships_role_fk" FOREIGN KEY ("role_scope","role_code") REFERENCES "public"."roles"("scope","code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_platform_role_fk" FOREIGN KEY ("platform_role_scope","platform_role_code") REFERENCES "public"."roles"("scope","code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."membership_role";--> statement-breakpoint
DROP TYPE "public"."platform_role";
