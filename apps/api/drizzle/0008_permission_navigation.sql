ALTER TABLE "permissions" ADD COLUMN "application" varchar(20) DEFAULT 'admin' NOT NULL;
--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "menu_label" varchar(80) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "path" varchar(120) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "icon" varchar(40) DEFAULT 'circle' NOT NULL;
--> statement-breakpoint
UPDATE "permissions" SET "menu_label" = 'Resumen', "path" = '/', "icon" = 'dashboard', "sort_order" = '010' WHERE "code" = 'dashboard.view';
UPDATE "permissions" SET "menu_label" = 'Pedidos', "path" = '/orders', "icon" = 'file', "sort_order" = '040' WHERE "code" = 'orders.view';
UPDATE "permissions" SET "menu_label" = 'Usuarios', "path" = '/users', "icon" = 'users', "sort_order" = '060' WHERE "code" = 'users.view';
UPDATE "permissions" SET "menu_label" = 'Roles', "path" = '/roles', "icon" = 'shield', "sort_order" = '070' WHERE "code" = 'roles.view';
UPDATE "permissions" SET "menu_label" = 'Sesiones', "path" = '/sessions', "icon" = 'monitor', "sort_order" = '080' WHERE "code" = 'sessions.view';
--> statement-breakpoint
INSERT INTO "permissions" ("code", "name", "description", "application", "menu_label", "path", "icon", "sort_order") VALUES
	('customers.view', 'Ver clientes', 'Acceso a clientes y comercios.', 'admin', 'Clientes', '/customers', 'users', '020'),
	('products.view', 'Ver productos', 'Acceso al catálogo de productos.', 'admin', 'Productos', '/products', 'package', '030'),
	('routes.view', 'Ver rutas', 'Acceso a planificación y seguimiento de rutas.', 'admin', 'Rutas', '/routes', 'route', '050'),
	('mobile.work.view', 'Ver trabajo asignado', 'Acceso móvil a picking y carga.', 'mobile', 'Trabajo', '/', 'package', '110'),
	('mobile.route.view', 'Ver ruta del día', 'Acceso móvil a la ruta y sus entregas.', 'mobile', 'Ruta', '/route', 'route', '120');
--> statement-breakpoint
INSERT INTO "organization_role_permissions" ("organization_id", "role_code", "permission_code")
SELECT "organization_roles"."organization_id", "organization_roles"."code", "permissions"."code"
FROM "organization_roles"
JOIN "permissions" ON (
	("organization_roles"."code" IN ('owner', 'admin') AND "permissions"."code" IN ('customers.view', 'products.view', 'routes.view', 'mobile.work.view', 'mobile.route.view'))
	OR ("organization_roles"."code" = 'planner' AND "permissions"."code" IN ('customers.view', 'routes.view', 'mobile.route.view'))
	OR ("organization_roles"."code" = 'warehouse' AND "permissions"."code" IN ('products.view', 'mobile.work.view'))
	OR ("organization_roles"."code" = 'driver' AND "permissions"."code" IN ('mobile.work.view', 'mobile.route.view'))
)
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "application" DROP DEFAULT;
ALTER TABLE "permissions" ALTER COLUMN "menu_label" DROP DEFAULT;
ALTER TABLE "permissions" ALTER COLUMN "path" DROP DEFAULT;
ALTER TABLE "permissions" ALTER COLUMN "icon" DROP DEFAULT;
