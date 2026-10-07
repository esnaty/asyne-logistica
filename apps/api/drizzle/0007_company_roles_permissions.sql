CREATE TABLE "permissions" (
	"code" varchar(80) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(240) NOT NULL,
	"sort_order" varchar(4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_roles" (
	"organization_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(80) NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_roles_organization_id_code_pk" PRIMARY KEY("organization_id","code")
);
--> statement-breakpoint
CREATE TABLE "organization_role_permissions" (
	"organization_id" uuid NOT NULL,
	"role_code" varchar(40) NOT NULL,
	"permission_code" varchar(80) NOT NULL,
	CONSTRAINT "organization_role_permissions_organization_id_role_code_permission_code_pk" PRIMARY KEY("organization_id","role_code","permission_code")
);
--> statement-breakpoint
INSERT INTO "permissions" ("code", "name", "description", "sort_order") VALUES
	('dashboard.view', 'Ver resumen', 'Acceso a la pantalla de resumen.', '010'),
	('orders.view', 'Ver pedidos', 'Acceso al listado y gestión de pedidos.', '020'),
	('users.view', 'Ver usuarios', 'Acceso al listado y gestión de usuarios.', '030'),
	('sessions.view', 'Ver sesiones', 'Acceso al control de sesiones.', '040'),
	('roles.view', 'Ver roles', 'Acceso al listado y configuración de roles.', '050');
--> statement-breakpoint
INSERT INTO "organization_roles" ("organization_id", "code", "name", "is_system")
SELECT "organizations"."id", "roles"."code", "roles"."name", true
FROM "organizations"
CROSS JOIN "roles"
WHERE "roles"."scope" = 'company';
--> statement-breakpoint
INSERT INTO "organization_role_permissions" ("organization_id", "role_code", "permission_code")
SELECT "organization_roles"."organization_id", "organization_roles"."code", "permissions"."code"
FROM "organization_roles"
CROSS JOIN "permissions"
WHERE "organization_roles"."code" IN ('owner', 'admin')
	OR ("organization_roles"."code" IN ('planner', 'warehouse', 'driver') AND "permissions"."code" IN ('dashboard.view', 'orders.view'));
--> statement-breakpoint
ALTER TABLE "organization_memberships" DROP CONSTRAINT "memberships_role_fk";
--> statement-breakpoint
ALTER TABLE "organization_memberships" DROP COLUMN "role_scope";
--> statement-breakpoint
ALTER TABLE "organization_roles" ADD CONSTRAINT "organization_roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_role_permissions" ADD CONSTRAINT "organization_role_permissions_permission_code_permissions_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permissions"("code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_role_permissions" ADD CONSTRAINT "organization_role_permissions_role_fk" FOREIGN KEY ("organization_id","role_code") REFERENCES "public"."organization_roles"("organization_id","code") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "memberships_role_fk" FOREIGN KEY ("organization_id","role_code") REFERENCES "public"."organization_roles"("organization_id","code") ON DELETE restrict ON UPDATE no action;
