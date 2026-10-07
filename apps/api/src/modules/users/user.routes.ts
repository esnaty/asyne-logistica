import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../../database/client.js'
import { organizationMemberships, users } from '../../database/schema.js'
import {
  getOrganizationAuthContext,
  requireAuthentication,
  requireRoles,
} from '../../middleware/authentication.js'

export const userRouter = Router()

userRouter.use(requireAuthentication)

userRouter.get('/', requireRoles('owner', 'admin'), async (_request, response) => {
  const auth = getOrganizationAuthContext(response)
  const members = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      secondLastName: users.secondLastName,
      phone: users.phone,
      status: users.status,
      role: organizationMemberships.role,
      memberSince: organizationMemberships.createdAt,
    })
    .from(organizationMemberships)
    .innerJoin(users, eq(users.id, organizationMemberships.userId))
    .where(eq(organizationMemberships.organizationId, auth.organizationId))
  response.json({ data: members })
})
