CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"supplier_id" uuid,
	"sku" varchar(80) NOT NULL,
	"name" varchar(180) NOT NULL,
	"description" text,
	"category" varchar(120),
	"unit" varchar(40) DEFAULT 'unit' NOT NULL,
	"weight_kg" double precision,
	"length_cm" double precision,
	"width_cm" double precision,
	"height_cm" double precision,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"code" varchar(160) NOT NULL,
	"type" varchar(30) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_business_partners_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."business_partners"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "product_codes" ADD CONSTRAINT "product_codes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "product_codes" ADD CONSTRAINT "product_codes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "products_organization_idx" ON "products" USING btree ("organization_id");
CREATE INDEX "products_supplier_idx" ON "products" USING btree ("supplier_id");
CREATE UNIQUE INDEX "products_org_sku_idx" ON "products" USING btree ("organization_id", "sku");
CREATE INDEX "product_codes_product_idx" ON "product_codes" USING btree ("product_id");
CREATE UNIQUE INDEX "product_codes_org_code_idx" ON "product_codes" USING btree ("organization_id", "code");
