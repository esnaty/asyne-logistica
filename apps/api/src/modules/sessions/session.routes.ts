import { Router } from 'express'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../database/client.js'
import { sessions } from '../../database/schema.js'
import { getAuthContext, requireAuthentication } from '../../middleware/authentication.js'
import { HttpError } from '../../shared/http-error.js'
import { clearSessionCookie } from '../auth/session.service.js'

export const sessionRouter = Router()

sessionRouter.use(requireAuthentication)

sessionRouter.get('/', async (_request, response) => {
  const auth = getAuthContext(response)
  const results = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
      createdAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, auth.userId), isNull(sessions.revokedAt)))
    .orderBy(desc(sessions.lastSeenAt))
  response.json({
    data: results.map((session) => ({ ...session, current: session.id === auth.sessionId })),
  })
})

sessionRouter.delete('/:sessionId', async (request, response) => {
  const auth = getAuthContext(response)
  const [revoked] = await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, request.params.sessionId), eq(sessions.userId, auth.userId)))
    .returning({ id: sessions.id })
  if (!revoked) throw new HttpError(404, 'SESSION_NOT_FOUND', 'Session not found.')

  if (revoked.id === auth.sessionId) clearSessionCookie(response)
  response.status(204).send()
})
