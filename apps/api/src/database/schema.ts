import { sql } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  geometry,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const organizationStatus = pgEnum('organization_status', ['active', 'suspended'])
export const userStatus = pgEnum('user_status', ['active', 'disabled'])
export type PlatformRole = 'user' | 'admin' | 'superuser'
export type CompanyRole = string

export const roles = pgTable(
  'roles',
  {
    scope: varchar('scope', { length: 20 }).$type<'global' | 'company'>().notNull(),
    code: varchar('code', { length: 40 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    sortOrder: varchar('sort_order', { length: 4 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.scope, table.code] })],
)

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull(),
    logoUrl: text('logo_url'),
    primaryColor: varchar('primary_color', { length: 7 }).notNull().default('#2563EB'),
    status: organizationStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('organizations_slug_idx').on(table.slug)],
)

export const permissions = pgTable('permissions', {
  code: varchar('code', { length: 80 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 240 }).notNull(),
  application: varchar('application', { length: 20 }).$type<'admin' | 'mobile'>().notNull(),
  menuLabel: varchar('menu_label', { length: 80 }).notNull(),
  path: varchar('path', { length: 120 }).notNull(),
  icon: varchar('icon', { length: 40 }).notNull(),
  sortOrder: varchar('sort_order', { length: 4 }).notNull(),
})

export const organizationRoles = pgTable(
  'organization_roles',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 40 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.code] })],
)

export const organizationRolePermissions = pgTable(
  'organization_role_permissions',
  {
    organizationId: uuid('organization_id').notNull(),
    roleCode: varchar('role_code', { length: 40 }).notNull(),
    permissionCode: varchar('permission_code', { length: 80 })
      .notNull()
      .references(() => permissions.code, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.roleCode, table.permissionCode] }),
    foreignKey({
      columns: [table.organizationId, table.roleCode],
      foreignColumns: [organizationRoles.organizationId, organizationRoles.code],
      name: 'organization_role_permissions_role_fk',
    }).onDelete('cascade'),
  ],
)

export const businessPartners = pgTable(
  'business_partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 180 }).notNull(),
    taxId: varchar('tax_id', { length: 40 }),
    externalCode: varchar('external_code', { length: 80 }),
    isSender: boolean('is_sender').notNull().default(false),
    isRecipient: boolean('is_recipient').notNull().default(false),
    contactName: varchar('contact_name', { length: 160 }),
    email: varchar('email', { length: 320 }),
    phone: varchar('phone', { length: 32 }),
    status: varchar('status', { length: 20 }).$type<'active' | 'inactive'>().notNull().default('active'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('business_partners_organization_idx').on(table.organizationId),
    uniqueIndex('business_partners_org_external_code_idx')
      .on(table.organizationId, table.externalCode)
      .where(sql`${table.externalCode} is not null`),
    uniqueIndex('business_partners_org_tax_id_idx')
      .on(table.organizationId, table.taxId)
      .where(sql`${table.taxId} is not null`),
  ],
)

export const partnerLocations = pgTable(
  'partner_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => businessPartners.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 140 }).notNull(),
    address: varchar('address', { length: 240 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }),
    city: varchar('city', { length: 120 }).notNull(),
    province: varchar('province', { length: 120 }),
    country: varchar('country', { length: 2 }).notNull().default('ES'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    receivingHours: varchar('receiving_hours', { length: 180 }),
    serviceMinutes: integer('service_minutes').notNull().default(10),
    instructions: text('instructions'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('partner_locations_organization_idx').on(table.organizationId),
    index('partner_locations_partner_idx').on(table.partnerId),
  ],
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id').references(() => businessPartners.id, { onDelete: 'set null' }),
    sku: varchar('sku', { length: 80 }).notNull(),
    name: varchar('name', { length: 180 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 120 }),
    unit: varchar('unit', { length: 40 }).notNull().default('unit'),
    weightKg: doublePrecision('weight_kg'),
    lengthCm: doublePrecision('length_cm'),
    widthCm: doublePrecision('width_cm'),
    heightCm: doublePrecision('height_cm'),
    status: varchar('status', { length: 20 }).$type<'active' | 'inactive'>().notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_organization_idx').on(table.organizationId),
    index('products_supplier_idx').on(table.supplierId),
    uniqueIndex('products_org_sku_idx').on(table.organizationId, table.sku),
  ],
)

export const productCodes = pgTable(
  'product_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 160 }).notNull(),
    type: varchar('type', { length: 30 }).$type<'barcode' | 'qr' | 'supplier' | 'other'>().notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('product_codes_product_idx').on(table.productId),
    uniqueIndex('product_codes_org_code_idx').on(table.organizationId, table.code),
  ],
)

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 320 }).notNull(),
    username: varchar('username', { length: 50 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 140 }).notNull(),
    secondLastName: varchar('second_last_name', { length: 140 }),
    phone: varchar('phone', { length: 32 }),
    avatarUrl: text('avatar_url'),
    platformRoleScope: varchar('platform_role_scope', { length: 20 })
      .$type<'global'>()
      .notNull()
      .default('global'),
    platformRole: varchar('platform_role_code', { length: 40 })
      .$type<PlatformRole>()
      .notNull()
      .default('user'),
    status: userStatus('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_lower_idx').on(sql`lower(${table.email})`),
    uniqueIndex('users_username_lower_idx').on(sql`lower(${table.username})`),
    uniqueIndex('users_phone_idx').on(table.phone).where(sql`${table.phone} is not null`),
    foreignKey({
      columns: [table.platformRoleScope, table.platformRole],
      foreignColumns: [roles.scope, roles.code],
      name: 'users_platform_role_fk',
    }),
  ],
)

export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role_code', { length: 40 }).$type<CompanyRole>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    index('memberships_user_idx').on(table.userId),
    foreignKey({
      columns: [table.organizationId, table.role],
      foreignColumns: [organizationRoles.organizationId, organizationRoles.code],
      name: 'memberships_role_fk',
    }).onDelete('restrict'),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activeOrganizationId: uuid('active_organization_id')
      .references(() => organizations.id, { onDelete: 'set null' }),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
    index('sessions_user_idx').on(table.userId),
    index('sessions_expires_idx').on(table.expiresAt),
  ],
)

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    externalCode: varchar('external_code', { length: 100 }),
    address: text('address').notNull(),
    location: geometry('location', { type: 'point', mode: 'xy', srid: 4326 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('customers_location_idx').using('gist', table.location),
    uniqueIndex('customers_org_external_code_idx')
      .on(table.organizationId, table.externalCode)
      .where(sql`${table.externalCode} is not null`),
  ],
)
