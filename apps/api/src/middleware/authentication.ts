import type { RequestHandler, Response } from 'express'
import { HttpError } from '../shared/http-error.js'
import type { AuthContext, MembershipRole } from '../modules/auth/auth.types.js'
import { verifyAccessToken } from '../modules/auth/auth.security.js'
import {
  resolveSession,
  resolveSessionById,
  SESSION_COOKIE,
} from '../modules/auth/session.service.js'

export const requireAuthentication: RequestHandler = async (request, response, next) => {
  const authorization = request.get('authorization')
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
  const sessionId = accessToken ? verifyAccessToken(accessToken) : null
  if (!sessionId) {
    next(new HttpError(401, 'INVALID_ACCESS_TOKEN', 'A valid Bearer access token is required.'))
    return
  }

  const auth = await resolveSessionById(sessionId)
  if (!auth) {
    next(new HttpError(401, 'INVALID_SESSION', 'The session is invalid or expired.'))
    return
  }

  response.locals.auth = auth
  next()
}

export const requireCookieSession: RequestHandler = async (request, response, next) => {
  const token = request.cookies?.[SESSION_COOKIE] as string | undefined
  if (!token) {
    next(new HttpError(401, 'UNAUTHENTICATED', 'Authentication is required.'))
    return
  }

  const auth = await resolveSession(token)
  if (!auth) {
    next(new HttpError(401, 'INVALID_SESSION', 'The session is invalid or expired.'))
    return
  }

  response.locals.auth = auth
  next()
}

export function requireRoles(...roles: MembershipRole[]): RequestHandler {
  return (_request, response, next) => {
    const auth = getAuthContext(response)
    if (!auth.role || !roles.includes(auth.role)) {
      next(new HttpError(403, 'FORBIDDEN', 'You do not have permission for this action.'))
      return
    }
    next()
  }
}

export const requireSuperuser: RequestHandler = (_request, response, next) => {
  const auth = getAuthContext(response)
  if (auth.platformRole !== 'superuser') {
    next(new HttpError(403, 'SUPERUSER_REQUIRED', 'Platform superuser access is required.'))
    return
  }
  next()
}

export const requirePlatformAdmin: RequestHandler = (_request, response, next) => {
  const auth = getAuthContext(response)
  if (auth.platformRole !== 'admin' && auth.platformRole !== 'superuser') {
    next(new HttpError(403, 'PLATFORM_ADMIN_REQUIRED', 'Platform administrator access is required.'))
    return
  }
  next()
}

export function requirePermission(permission: string): RequestHandler {
  return (_request, response, next) => {
    const auth = getAuthContext(response)
    if (auth.platformRole !== 'superuser' && !auth.permissions.includes(permission)) {
      next(new HttpError(403, 'PERMISSION_REQUIRED', 'You do not have permission for this action.'))
      return
    }
    next()
  }
}

export function getAuthContext(response: Response) {
  return response.locals.auth as AuthContext
}

export type OrganizationAuthContext = AuthContext & {
  organizationId: string
  organizationName: string
  organizationSlug: string
  role: MembershipRole
}

export function getOrganizationAuthContext(response: Response): OrganizationAuthContext {
  const auth = getAuthContext(response)
  if (!auth.organizationId || !auth.organizationName || !auth.organizationSlug || !auth.role) {
    throw new HttpError(403, 'ORGANIZATION_CONTEXT_REQUIRED', 'An active organization is required.')
  }
  return auth as OrganizationAuthContext
}
