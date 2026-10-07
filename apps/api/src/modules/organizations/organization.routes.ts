import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../../database/client.js'
import { organizationMemberships, organizations } from '../../database/schema.js'
import {
  getOrganizationAuthContext,
  requireAuthentication,
  requireRoles,
} from '../../middleware/authentication.js'
import { updateOrganizationSchema } from './organization.schemas.js'

export const organizationRouter = Router()

organizationRouter.use(requireAuthentication)

organizationRouter.get('/', async (_request, response) => {
  const auth = getOrganizationAuthContext(response)
  const results = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      status: organizations.status,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizations.id, organizationMemberships.organizationId))
    .where(eq(organizationMemberships.userId, auth.userId))
  response.json({ data: results })
})

organizationRouter.get('/current', async (_request, response) => {
  const auth = getOrganizationAuthContext(response)
  response.json({
    id: auth.organizationId,
    name: auth.organizationName,
    slug: auth.organizationSlug,
    role: auth.role,
  })
})

organizationRouter.patch('/current', requireRoles('owner', 'admin'), async (request, response) => {
  const input = updateOrganizationSchema.parse(request.body)
  const auth = getOrganizationAuthContext(response)
  const [organization] = await db
    .update(organizations)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(organizations.id, auth.organizationId), eq(organizations.status, 'active')))
    .returning({ id: organizations.id, name: organizations.name, slug: organizations.slug })
  response.json(organization)
})
