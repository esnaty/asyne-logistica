import { Router } from 'express'
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import { rateLimit } from 'express-rate-limit'
import { db } from '../../database/client.js'
import {
  organizationMemberships,
  organizationRolePermissions,
  organizationRoles,
  organizations,
  permissions,
  sessions,
  users,
} from '../../database/schema.js'
import {
  getAuthContext,
  requireAuthentication,
  requireCookieSession,
} from '../../middleware/authentication.js'
import { HttpError } from '../../shared/http-error.js'
import { createAccessToken, hashPassword, verifyPassword } from './auth.security.js'
import { loginSchema, registerSchema, switchOrganizationSchema } from './auth.schemas.js'
import { publicImageUrl } from '../uploads/image-storage.js'
import { clearSessionCookie, createSession } from './session.service.js'
import { defaultCompanyRoles } from '../roles/role.constants.js'

export const authRouter = Router()

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
}

authRouter.post('/register', authRateLimit, async (request, response) => {
  const input = registerSchema.parse(request.body)
  const email = input.email.toLowerCase()
  const username = (
    input.username ?? `${email.split('@')[0] ?? 'user'}-${crypto.randomUUID().slice(0, 6)}`
  ).toLowerCase()
  const slug = input.organizationSlug ?? `${slugify(input.organizationName)}-${crypto.randomUUID().slice(0, 6)}`

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql<string>`lower(${users.email})`, email))
    .limit(1)
  if (existingUser) throw new HttpError(409, 'EMAIL_ALREADY_EXISTS', 'An account already uses this email.')

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql<string>`lower(${users.username})`, username))
    .limit(1)
  if (existingUsername) throw new HttpError(409, 'USERNAME_ALREADY_EXISTS', 'This username is unavailable.')

  const [existingOrganization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1)
  if (existingOrganization) {
    throw new HttpError(409, 'ORGANIZATION_SLUG_EXISTS', 'This organization identifier is unavailable.')
  }

  const passwordHash = await hashPassword(input.password)
  const result = await db.transaction(async (transaction) => {
    const [organization] = await transaction
      .insert(organizations)
      .values({ name: input.organizationName, slug })
      .returning()
    const [user] = await transaction
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        secondLastName: input.secondLastName,
        phone: input.phone,
      })
      .returning()

    if (!organization || !user) throw new Error('Registration transaction returned no records.')

    await transaction.insert(organizationRoles).values(
      defaultCompanyRoles.map((role) => ({ organizationId: organization.id, code: role.code, name: role.name, isSystem: true })),
    )
    await transaction.insert(organizationRolePermissions).values(
      defaultCompanyRoles.flatMap((role) => role.permissions.map((permissionCode) => ({
        organizationId: organization.id,
        roleCode: role.code,
        permissionCode,
      }))),
    )

    await transaction.insert(organizationMemberships).values({
      organizationId: organization.id,
      userId: user.id,
      role: 'owner',
    })

    return { organization, user }
  })

  const { accessToken } = await createSession(result.user.id, result.organization.id, request, response)
  response.status(201).json({
    accessToken,
    user: {
      id: result.user.id,
      email: result.user.email,
      username: result.user.username,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      secondLastName: result.user.secondLastName,
      phone: result.user.phone,
    },
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      slug: result.organization.slug,
      role: 'owner',
    },
  })
})

authRouter.post('/login', authRateLimit, async (request, response) => {
  const input = loginSchema.parse(request.body)
  const identifier = (input.identifier ?? input.email ?? '').toLowerCase()
  const [user] = await db
    .select()
    .from(users)
    .where(
      or(
        eq(sql<string>`lower(${users.email})`, identifier),
        eq(sql<string>`lower(${users.username})`, identifier),
      ),
    )
    .limit(1)

  if (!user || user.status !== 'active' || !(await verifyPassword(user.passwordHash, input.password))) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
  }

  const memberships = await db
    .select({
      organizationId: organizations.id,
      organizationSlug: organizations.slug,
      organizationStatus: organizations.status,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(eq(organizationMemberships.userId, user.id))

  const membership = input.organizationSlug
    ? memberships.find((item) => item.organizationSlug === input.organizationSlug)
    : memberships.find((item) => item.organizationStatus === 'active')
  if (user.platformRole !== 'superuser' && (!membership || membership.organizationStatus !== 'active')) {
    throw new HttpError(403, 'NO_ACTIVE_ORGANIZATION', 'No active organization is available.')
  }

  const { accessToken } = await createSession(
    user.id,
    membership?.organizationId ?? null,
    request,
    response,
  )
  response.json({ status: 'authenticated', accessToken })
})

authRouter.post('/access-token', requireCookieSession, (_request, response) => {
  const auth = getAuthContext(response)
  response.json({ accessToken: createAccessToken(auth.sessionId) })
})

authRouter.get('/me', requireAuthentication, async (request, response) => {
  const auth = getAuthContext(response)
  const navigation = auth.platformRole === 'superuser'
    ? await db.select().from(permissions).orderBy(asc(permissions.sortOrder))
    : auth.permissions.length
      ? await db.select().from(permissions).where(and(
          inArray(permissions.code, auth.permissions),
          auth.platformRole === 'user' ? eq(permissions.application, 'mobile') : undefined,
        )).orderBy(asc(permissions.sortOrder))
      : []
  const memberships = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
      primaryColor: organizations.primaryColor,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(
      and(
        eq(organizationMemberships.userId, auth.userId),
        eq(organizations.status, 'active'),
      ),
    )

  response.json({
    user: {
      id: auth.userId,
      email: auth.email,
      username: auth.username,
      firstName: auth.firstName,
      lastName: auth.lastName,
      secondLastName: auth.secondLastName,
      phone: auth.phone,
      avatarUrl: publicImageUrl(request, auth.avatarUrl),
      platformRole: auth.platformRole,
    },
    activeOrganization: auth.organizationId
      ? {
          id: auth.organizationId,
          name: auth.organizationName,
          slug: auth.organizationSlug,
          logoUrl: publicImageUrl(request, auth.organizationLogoUrl),
          primaryColor: auth.organizationPrimaryColor,
          role: auth.role,
          roleName: auth.roleName,
          permissions: auth.permissions,
        }
      : null,
    organizations: memberships.map((item) => ({ ...item, logoUrl: publicImageUrl(request, item.logoUrl) })),
    navigation,
  })
})

authRouter.post('/switch-organization', requireAuthentication, async (request, response) => {
  const input = switchOrganizationSchema.parse(request.body)
  const auth = getAuthContext(response)
  const [membership] = await db
    .select({ organizationId: organizations.id })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(
      and(
        eq(organizationMemberships.userId, auth.userId),
        eq(organizationMemberships.organizationId, input.organizationId),
        eq(organizations.status, 'active'),
      ),
    )
    .limit(1)
  if (!membership) throw new HttpError(403, 'ORGANIZATION_ACCESS_DENIED', 'Organization access denied.')

  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, auth.sessionId))
  const { accessToken } = await createSession(auth.userId, membership.organizationId, request, response)
  response.json({ status: 'organization_switched', accessToken })
})

authRouter.post('/logout', requireAuthentication, async (_request, response) => {
  const auth = getAuthContext(response)
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, auth.sessionId))
  clearSessionCookie(response)
  response.status(204).send()
})
