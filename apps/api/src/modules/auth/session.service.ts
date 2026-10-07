import type { Request, Response } from 'express'
import { and, eq, gt, isNull, sql, type SQL } from 'drizzle-orm'
import { db } from '../../database/client.js'
import {
  organizationMemberships,
  organizationRolePermissions,
  organizationRoles,
  organizations,
  sessions,
  users,
} from '../../database/schema.js'
import { env } from '../../config/env.js'
import type { AuthContext } from './auth.types.js'
import { createAccessToken, createSessionToken, hashSessionToken } from './auth.security.js'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1_000
export const SESSION_COOKIE = env.NODE_ENV === 'production' ? '__Host-asyne_session' : 'asyne_session'

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_TTL_MS,
  }
}

export async function createSession(
  userId: string,
  organizationId: string | null,
  request: Request,
  response: Response,
) {
  const token = createSessionToken()
  const [session] = await db
    .insert(sessions)
    .values({
      tokenHash: hashSessionToken(token),
      userId,
      activeOrganizationId: organizationId,
      userAgent: request.get('user-agent') ?? null,
      ipAddress: request.ip,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    })
    .returning({ id: sessions.id })

  response.cookie(SESSION_COOKIE, token, cookieOptions())
  if (!session) throw new Error('Session creation returned no record.')
  return { session, accessToken: createAccessToken(session.id) }
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, cookieOptions())
}

async function resolveSessionWhere(condition: SQL): Promise<AuthContext | null> {
  const [result] = await db
    .select({
      sessionId: sessions.id,
      activeOrganizationId: sessions.activeOrganizationId,
      userId: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      secondLastName: users.secondLastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      platformRole: users.platformRole,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        condition,
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
        eq(users.status, 'active'),
      ),
    )
    .limit(1)

  if (!result) return null

  let organization: {
    organizationId: string
    organizationName: string
    organizationSlug: string
    organizationLogoUrl: string | null
    organizationPrimaryColor: string
    role: string
    roleName: string
    permissions: string[]
  } | null = null

  if (result.activeOrganizationId) {
    const [membership] = await db
      .select({
        organizationId: organizations.id,
        organizationName: organizations.name,
        organizationSlug: organizations.slug,
        organizationLogoUrl: organizations.logoUrl,
        organizationPrimaryColor: organizations.primaryColor,
        role: organizationMemberships.role,
        roleName: organizationRoles.name,
        permissions: sql<string[]>`coalesce(array_agg(${organizationRolePermissions.permissionCode}) filter (where ${organizationRolePermissions.permissionCode} is not null), '{}')`,
      })
      .from(organizationMemberships)
      .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
      .innerJoin(
        organizationRoles,
        and(
          eq(organizationRoles.organizationId, organizationMemberships.organizationId),
          eq(organizationRoles.code, organizationMemberships.role),
        ),
      )
      .leftJoin(
        organizationRolePermissions,
        and(
          eq(organizationRolePermissions.organizationId, organizationMemberships.organizationId),
          eq(organizationRolePermissions.roleCode, organizationMemberships.role),
        ),
      )
      .where(
        and(
          eq(organizationMemberships.userId, result.userId),
          eq(organizationMemberships.organizationId, result.activeOrganizationId),
          eq(organizations.status, 'active'),
        ),
      )
      .groupBy(organizations.id, organizationMemberships.role, organizationRoles.name)
      .limit(1)
    organization = membership ?? null
  }

  if (!organization && result.platformRole !== 'superuser') return null

  await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, result.sessionId))
  return {
    sessionId: result.sessionId,
    userId: result.userId,
    email: result.email,
    username: result.username,
    firstName: result.firstName,
    lastName: result.lastName,
    secondLastName: result.secondLastName,
    phone: result.phone,
    avatarUrl: result.avatarUrl,
    platformRole: result.platformRole,
    organizationId: organization?.organizationId ?? null,
    organizationName: organization?.organizationName ?? null,
    organizationSlug: organization?.organizationSlug ?? null,
    organizationLogoUrl: organization?.organizationLogoUrl ?? null,
    organizationPrimaryColor: organization?.organizationPrimaryColor ?? null,
    role: organization?.role ?? null,
    roleName: organization?.roleName ?? null,
    permissions: organization?.permissions ?? [],
  }
}

export function resolveSession(token: string) {
  return resolveSessionWhere(eq(sessions.tokenHash, hashSessionToken(token)))
}

export function resolveSessionById(sessionId: string) {
  return resolveSessionWhere(eq(sessions.id, sessionId))
}
