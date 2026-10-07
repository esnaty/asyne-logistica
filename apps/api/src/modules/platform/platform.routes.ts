import { Router } from 'express'
import { and, desc, eq, ne, or, sql } from 'drizzle-orm'
import { db } from '../../database/client.js'
import { organizationMemberships, organizationRolePermissions, organizationRoles, organizations, users } from '../../database/schema.js'
import { requireAuthentication, requirePlatformAdmin, requireSuperuser } from '../../middleware/authentication.js'
import { HttpError } from '../../shared/http-error.js'
import { getAuthContext } from '../../middleware/authentication.js'
import { hashPassword } from '../auth/auth.security.js'
import {
  createPlatformOrganizationSchema,
  createPlatformUserSchema,
  updatePlatformOrganizationSchema,
  updatePlatformUserSchema,
} from './platform.schemas.js'
import { imageStorageKey, publicImageUrl } from '../uploads/image-storage.js'
import { defaultCompanyRoles } from '../roles/role.constants.js'

export const platformRouter = Router()

platformRouter.use(requireAuthentication)

platformRouter.get('/organizations', requireSuperuser, async (request, response) => {
  const results = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
      primaryColor: organizations.primaryColor,
      status: organizations.status,
      createdAt: organizations.createdAt,
      members: sql<number>`count(${organizationMemberships.userId})::int`,
    })
    .from(organizations)
    .leftJoin(
      organizationMemberships,
      eq(organizationMemberships.organizationId, organizations.id),
    )
    .groupBy(organizations.id)
    .orderBy(desc(organizations.createdAt))
  response.json({ data: results.map((item) => ({ ...item, logoUrl: publicImageUrl(request, item.logoUrl) })) })
})

platformRouter.post('/organizations', requireSuperuser, async (request, response) => {
  const input = createPlatformOrganizationSchema.parse(request.body)
  const [existing] = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.slug, input.slug))
  if (existing) throw new HttpError(409, 'ORGANIZATION_SLUG_EXISTS', 'El identificador ya está en uso.')
  const organization = await db.transaction(async (transaction) => {
    const [created] = await transaction.insert(organizations).values({ ...input, logoUrl: imageStorageKey(input.logoUrl) }).returning()
    if (!created) throw new Error('Organization creation returned no record.')
    await transaction.insert(organizationRoles).values(
      defaultCompanyRoles.map((role) => ({ organizationId: created.id, code: role.code, name: role.name, isSystem: true })),
    )
    await transaction.insert(organizationRolePermissions).values(
      defaultCompanyRoles.flatMap((role) => role.permissions.map((permissionCode) => ({ organizationId: created.id, roleCode: role.code, permissionCode }))),
    )
    return created
  })
  response.status(201).json(organization)
})

platformRouter.patch('/organizations/:organizationId', requireSuperuser, async (request, response) => {
  const input = updatePlatformOrganizationSchema.parse(request.body)
  const organizationId = String(request.params.organizationId)
  const [organization] = await db
    .update(organizations)
    .set({ ...input, ...(input.logoUrl !== undefined ? { logoUrl: imageStorageKey(input.logoUrl) } : {}), updatedAt: new Date() })
    .where(eq(organizations.id, organizationId))
    .returning()
  if (!organization) throw new HttpError(404, 'ORGANIZATION_NOT_FOUND', 'Organization not found.')
  response.json(organization)
})

platformRouter.delete('/organizations/:organizationId', requireSuperuser, async (request, response) => {
  const auth = getAuthContext(response)
  const organizationId = String(request.params.organizationId)
  if (auth.organizationId === organizationId) {
    throw new HttpError(409, 'ACTIVE_ORGANIZATION_DELETE', 'No puedes eliminar tu empresa activa.')
  }
  const [organization] = await db.delete(organizations).where(eq(organizations.id, organizationId)).returning({ id: organizations.id })
  if (!organization) throw new HttpError(404, 'ORGANIZATION_NOT_FOUND', 'Empresa no encontrada.')
  response.status(204).send()
})

platformRouter.get('/users', requirePlatformAdmin, async (request, response) => {
  const auth = getAuthContext(response)
  const results = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      secondLastName: users.secondLastName,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      platformRole: users.platformRole,
      status: users.status,
      createdAt: users.createdAt,
      memberships: sql<number>`count(${organizationMemberships.organizationId})::int`,
      organizationId: sql<string | null>`min(${organizationMemberships.organizationId}::text)`,
      organizationRole: sql<string | null>`min(${organizationMemberships.role}::text)`,
    })
    .from(users)
    .leftJoin(organizationMemberships, eq(organizationMemberships.userId, users.id))
    .where(auth.platformRole === 'admin' ? eq(organizationMemberships.organizationId, auth.organizationId!) : undefined)
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
  response.json({ data: results.map((item) => ({ ...item, avatarUrl: publicImageUrl(request, item.avatarUrl) })) })
})

async function assertUniqueUser(email: string, username: string, phone: string | null, excludedId?: string) {
  const matches = or(
    sql`lower(${users.email}) = lower(${email})`,
    sql`lower(${users.username}) = lower(${username})`,
    ...(phone ? [eq(users.phone, phone)] : []),
  )
  const [existing] = await db.select({ id: users.id }).from(users).where(excludedId ? and(matches, ne(users.id, excludedId)) : matches)
  if (existing) throw new HttpError(409, 'USER_IDENTIFIER_EXISTS', 'El correo, username o teléfono ya está en uso.')
}

platformRouter.post('/users', requirePlatformAdmin, async (request, response) => {
  const input = createPlatformUserSchema.parse(request.body)
  const auth = getAuthContext(response)
  const organizationId = managedOrganizationId(auth, input.organizationId)
  if (auth.platformRole === 'admin' && input.platformRole === 'superuser') throw new HttpError(403, 'ROLE_ASSIGNMENT_FORBIDDEN', 'No puedes asignar el rol superuser.')
  const phone = input.phone || null
  await assertUniqueUser(input.email, input.username, phone)
  const organization = await db.query.organizations.findFirst({ where: eq(organizations.id, organizationId), columns: { id: true } })
  if (!organization) throw new HttpError(404, 'ORGANIZATION_NOT_FOUND', 'Empresa no encontrada.')
  await assertOrganizationRole(organizationId, input.role)
  const passwordHash = await hashPassword(input.password)
  const user = await db.transaction(async (transaction) => {
    const [created] = await transaction.insert(users).values({
      email: input.email.toLowerCase(), username: input.username.toLowerCase(), passwordHash,
      firstName: input.firstName, lastName: input.lastName, secondLastName: input.secondLastName || null,
      phone, avatarUrl: imageStorageKey(input.avatarUrl), status: input.status, platformRole: input.platformRole,
    }).returning()
    if (!created) throw new Error('User creation returned no record.')
    await transaction.insert(organizationMemberships).values({ organizationId, userId: created.id, role: input.role })
    return created
  })
  response.status(201).json(user)
})

platformRouter.put('/users/:userId', requirePlatformAdmin, async (request, response) => {
  const input = updatePlatformUserSchema.parse(request.body)
  const auth = getAuthContext(response)
  const userId = String(request.params.userId)
  const organizationId = managedOrganizationId(auth, input.organizationId)
  await assertManagedUser(auth, userId)
  await assertOrganizationRole(organizationId, input.role)
  if (auth.platformRole === 'admin' && input.platformRole === 'superuser') throw new HttpError(403, 'ROLE_ASSIGNMENT_FORBIDDEN', 'No puedes asignar el rol superuser.')
  const phone = input.phone || null
  await assertUniqueUser(input.email, input.username, phone, userId)
  const passwordHash = input.password ? await hashPassword(input.password) : undefined
  const user = await db.transaction(async (transaction) => {
    const [updated] = await transaction.update(users).set({
      email: input.email.toLowerCase(), username: input.username.toLowerCase(), firstName: input.firstName,
      lastName: input.lastName, secondLastName: input.secondLastName || null, phone, avatarUrl: imageStorageKey(input.avatarUrl), status: input.status,
      platformRole: input.platformRole, ...(passwordHash ? { passwordHash } : {}), updatedAt: new Date(),
    }).where(eq(users.id, userId)).returning()
    if (!updated) throw new HttpError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.')
    await transaction.delete(organizationMemberships).where(eq(organizationMemberships.userId, updated.id))
    await transaction.insert(organizationMemberships).values({ organizationId, userId: updated.id, role: input.role })
    return updated
  })
  response.json(user)
})

platformRouter.delete('/users/:userId', requirePlatformAdmin, async (request, response) => {
  const auth = getAuthContext(response)
  const userId = String(request.params.userId)
  if (auth.userId === userId) throw new HttpError(409, 'SELF_DELETE', 'No puedes eliminar tu propia cuenta.')
  await assertManagedUser(auth, userId)
  const [user] = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id })
  if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'Usuario no encontrado.')
  response.status(204).send()
})

function managedOrganizationId(auth: ReturnType<typeof getAuthContext>, requestedId: string) {
  if (auth.platformRole === 'superuser') return requestedId
  if (!auth.organizationId || auth.organizationId !== requestedId) throw new HttpError(403, 'ORGANIZATION_SCOPE_FORBIDDEN', 'Solo puedes gestionar usuarios de tu empresa.')
  return auth.organizationId
}

async function assertManagedUser(auth: ReturnType<typeof getAuthContext>, userId: string) {
  if (auth.platformRole === 'superuser') return
  if (!auth.organizationId) throw new HttpError(403, 'ORGANIZATION_CONTEXT_REQUIRED', 'Se requiere una empresa activa.')
  const [membership] = await db.select({ userId: organizationMemberships.userId }).from(organizationMemberships).where(and(eq(organizationMemberships.userId, userId), eq(organizationMemberships.organizationId, auth.organizationId)))
  if (!membership) throw new HttpError(404, 'USER_NOT_FOUND', 'Usuario no encontrado en tu empresa.')
}

async function assertOrganizationRole(organizationId: string, roleCode: string) {
  const [role] = await db.select({ code: organizationRoles.code }).from(organizationRoles).where(and(
    eq(organizationRoles.organizationId, organizationId),
    eq(organizationRoles.code, roleCode),
  ))
  if (!role) throw new HttpError(400, 'INVALID_COMPANY_ROLE', 'El rol seleccionado no pertenece a la empresa.')
}
