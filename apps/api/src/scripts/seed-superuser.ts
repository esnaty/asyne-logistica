import { eq, or, sql } from 'drizzle-orm'
import { db, pool } from '../database/client.js'
import { organizationMemberships, organizations, users } from '../database/schema.js'
import { hashPassword } from '../modules/auth/auth.security.js'

const email = process.env.SUPERUSER_EMAIL?.trim().toLowerCase()
const password = process.env.SUPERUSER_PASSWORD
const firstName = process.env.SUPERUSER_FIRST_NAME?.trim() || 'Asyne'
const lastName = process.env.SUPERUSER_LAST_NAME?.trim() || 'Administrador'
const secondLastName = process.env.SUPERUSER_SECOND_LAST_NAME?.trim() || null
const username = process.env.SUPERUSER_USERNAME?.trim().toLowerCase() || 'superuser'
const phone = process.env.SUPERUSER_PHONE?.trim() || null
const organizationName = process.env.SUPERUSER_ORGANIZATION_NAME?.trim() || 'Asyne Logística'
const organizationSlug = process.env.SUPERUSER_ORGANIZATION_SLUG?.trim() || 'asyne-logistica'

if (!email || !password || password.length < 12) {
  throw new Error('SUPERUSER_EMAIL and SUPERUSER_PASSWORD (minimum 12 characters) are required.')
}

const passwordHash = await hashPassword(password)
const [existing] = await db
  .select({ id: users.id })
  .from(users)
  .where(
    or(
      eq(sql<string>`lower(${users.email})`, email),
      eq(users.platformRole, 'superuser'),
    ),
  )
  .limit(1)

if (existing) {
  await db
    .update(users)
    .set({
      email,
      passwordHash,
      username,
      firstName,
      lastName,
      secondLastName,
      phone,
      platformRole: 'superuser',
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id))
  console.log(`Updated superuser ${email}`)
} else {
  await db.insert(users).values({
    email,
    username,
    passwordHash,
    firstName,
    lastName,
    secondLastName,
    phone,
    platformRole: 'superuser',
  })
  console.log(`Created superuser ${email}`)
}

const [superuser] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(sql<string>`lower(${users.email})`, email))
  .limit(1)
if (!superuser) throw new Error('Superuser was not found after upsert.')

const [existingOrganization] = await db
  .select({ id: organizations.id })
  .from(organizations)
  .where(eq(organizations.slug, organizationSlug))
  .limit(1)
const organization = existingOrganization
  ? existingOrganization
  : (
      await db
        .insert(organizations)
        .values({ name: organizationName, slug: organizationSlug })
        .returning({ id: organizations.id })
    )[0]
if (!organization) throw new Error('Organization creation returned no record.')

await db
  .insert(organizationMemberships)
  .values({ organizationId: organization.id, userId: superuser.id, role: 'owner' })
  .onConflictDoUpdate({
    target: [organizationMemberships.organizationId, organizationMemberships.userId],
    set: { role: 'owner' },
  })
console.log(`Linked superuser to ${organizationSlug} as owner`)

await pool.end()
