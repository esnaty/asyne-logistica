CREATE TABLE "business_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"tax_id" varchar(40),
	"external_code" varchar(80),
	"is_sender" boolean DEFAULT false NOT NULL,
	"is_recipient" boolean DEFAULT false NOT NULL,
	"contact_name" varchar(160),
	"email" varchar(320),
	"phone" varchar(32),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"address" varchar(240) NOT NULL,
	"postal_code" varchar(20),
	"city" varchar(120) NOT NULL,
	"province" varchar(120),
	"country" varchar(2) DEFAULT 'ES' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"receiving_hours" varchar(180),
	"service_minutes" integer DEFAULT 10 NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_partners" ADD CONSTRAINT "business_partners_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "partner_locations" ADD CONSTRAINT "partner_locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "partner_locations" ADD CONSTRAINT "partner_locations_partner_id_business_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."business_partners"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "business_partners_organization_idx" ON "business_partners" USING btree ("organization_id");
CREATE UNIQUE INDEX "business_partners_org_external_code_idx" ON "business_partners" USING btree ("organization_id","external_code") WHERE "business_partners"."external_code" is not null;
CREATE UNIQUE INDEX "business_partners_org_tax_id_idx" ON "business_partners" USING btree ("organization_id","tax_id") WHERE "business_partners"."tax_id" is not null;
CREATE INDEX "partner_locations_organization_idx" ON "partner_locations" USING btree ("organization_id");
CREATE INDEX "partner_locations_partner_idx" ON "partner_locations" USING btree ("partner_id");
--> statement-breakpoint
INSERT INTO "permissions" ("code", "name", "description", "application", "menu_label", "path", "icon", "sort_order")
VALUES ('partners.view', 'Ver intervinientes', 'Acceso a remitentes, destinatarios y sus ubicaciones.', 'admin', 'Intervinientes', '/partners', 'building', '020');
--> statement-breakpoint
INSERT INTO "organization_role_permissions" ("organization_id", "role_code", "permission_code")
SELECT "organization_id", "role_code", 'partners.view'
FROM "organization_role_permissions"
WHERE "permission_code" = 'customers.view'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
DELETE FROM "permissions" WHERE "code" = 'customers.view';
