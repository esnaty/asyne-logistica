import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../../database/client.js'
import { organizationMemberships, organizationRolePermissions, organizationRoles, permissions, roles } from '../../database/schema.js'
import { getAuthContext, requireAuthentication, requirePlatformAdmin } from '../../middleware/authentication.js'
import { HttpError } from '../../shared/http-error.js'
import { createCompanyRoleSchema, updateCompanyRoleSchema } from './role.schemas.js'

export const roleRouter = Router()
roleRouter.use(requireAuthentication)

roleRouter.get('/', async (request, response) => {
  const auth = getAuthContext(response)
  const requestedOrganizationId = typeof request.query.organizationId === 'string' ? request.query.organizationId : null
  const organizationId = auth.platformRole === 'superuser' && requestedOrganizationId
    ? requestedOrganizationId
    : auth.organizationId
  const globalCatalog = await db.select().from(roles).orderBy(asc(roles.sortOrder))
  const globalRoles = globalCatalog.filter((role) => {
    if (role.scope !== 'global') return false
    if (auth.platformRole === 'superuser') return true
    if (auth.platformRole === 'admin') return role.code !== 'superuser'
    return role.code === 'user'
  })
  const companyRoles = organizationId
    ? await db.select({
        code: organizationRoles.code,
        name: organizationRoles.name,
        isSystem: organizationRoles.isSystem,
        permissions: sql<string[]>`coalesce(array_agg(${organizationRolePermissions.permissionCode}) filter (where ${organizationRolePermissions.permissionCode} is not null), '{}')`,
      }).from(organizationRoles).leftJoin(
        organizationRolePermissions,
        and(
          eq(organizationRolePermissions.organizationId, organizationRoles.organizationId),
          eq(organizationRolePermissions.roleCode, organizationRoles.code),
        ),
      ).where(eq(organizationRoles.organizationId, organizationId))
        .groupBy(organizationRoles.organizationId, organizationRoles.code)
        .orderBy(asc(organizationRoles.name))
    : []
  response.json({ global: globalRoles, company: companyRoles })
})

roleRouter.get('/permissions', requirePlatformAdmin, async (_request, response) => {
  response.json({ data: await db.select().from(permissions).orderBy(asc(permissions.sortOrder)) })
})

roleRouter.post('/company', requirePlatformAdmin, async (request, response) => {
  const organizationId = requireOrganization(getAuthContext(response).organizationId)
  const input = createCompanyRoleSchema.parse(request.body)
  await assertPermissionCodes(input.permissions)
  const [existing] = await db.select({ code: organizationRoles.code }).from(organizationRoles)
    .where(and(eq(organizationRoles.organizationId, organizationId), eq(organizationRoles.code, input.code)))
  if (existing) throw new HttpError(409, 'ROLE_CODE_EXISTS', 'Ya existe un rol con ese código.')
  const role = await db.transaction(async (transaction) => {
    const [created] = await transaction.insert(organizationRoles)
      .values({ organizationId, code: input.code, name: input.name }).returning()
    if (input.permissions.length) await transaction.insert(organizationRolePermissions).values(
      input.permissions.map((permissionCode) => ({ organizationId, roleCode: input.code, permissionCode })),
    )
    return created
  })
  response.status(201).json(role)
})

roleRouter.put('/company/:code', requirePlatformAdmin, async (request, response) => {
  const organizationId = requireOrganization(getAuthContext(response).organizationId)
  const code = String(request.params.code)
  const input = updateCompanyRoleSchema.parse(request.body)
  await assertPermissionCodes(input.permissions)
  const updated = await db.transaction(async (transaction) => {
    const [role] = await transaction.update(organizationRoles).set({ name: input.name, updatedAt: new Date() })
      .where(and(eq(organizationRoles.organizationId, organizationId), eq(organizationRoles.code, code))).returning()
    if (!role) throw new HttpError(404, 'ROLE_NOT_FOUND', 'Rol no encontrado.')
    await transaction.delete(organizationRolePermissions).where(and(
      eq(organizationRolePermissions.organizationId, organizationId),
      eq(organizationRolePermissions.roleCode, code),
    ))
    if (input.permissions.length) await transaction.insert(organizationRolePermissions).values(
      input.permissions.map((permissionCode) => ({ organizationId, roleCode: code, permissionCode })),
    )
    return role
  })
  response.json(updated)
})

roleRouter.delete('/company/:code', requirePlatformAdmin, async (request, response) => {
  const organizationId = requireOrganization(getAuthContext(response).organizationId)
  const code = String(request.params.code)
  const [role] = await db.select({ isSystem: organizationRoles.isSystem }).from(organizationRoles)
    .where(and(eq(organizationRoles.organizationId, organizationId), eq(organizationRoles.code, code)))
  if (!role) throw new HttpError(404, 'ROLE_NOT_FOUND', 'Rol no encontrado.')
  if (role.isSystem) throw new HttpError(409, 'SYSTEM_ROLE_DELETE', 'Los roles iniciales no se pueden eliminar.')
  const [membership] = await db.select({ userId: organizationMemberships.userId }).from(organizationMemberships)
    .where(and(eq(organizationMemberships.organizationId, organizationId), eq(organizationMemberships.role, code)))
  if (membership) throw new HttpError(409, 'ROLE_IN_USE', 'No puedes eliminar un rol que tiene usuarios asignados.')
  await db.delete(organizationRoles).where(and(eq(organizationRoles.organizationId, organizationId), eq(organizationRoles.code, code)))
  response.status(204).send()
})

function requireOrganization(organizationId: string | null) {
  if (!organizationId) throw new HttpError(403, 'ORGANIZATION_CONTEXT_REQUIRED', 'Se requiere una empresa activa.')
  return organizationId
}

async function assertPermissionCodes(codes: string[]) {
  if (!codes.length) return
  const found = await db.select({ code: permissions.code }).from(permissions).where(inArray(permissions.code, codes))
  if (found.length !== new Set(codes).size) throw new HttpError(400, 'INVALID_PERMISSIONS', 'Uno o más permisos no son válidos.')
}
