import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import swaggerUi from 'swagger-ui-express'
import { corsOrigins } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { healthRouter } from './modules/health/health.routes.js'
import { authRouter } from './modules/auth/auth.routes.js'
import { optimizationRouter } from './modules/optimization/optimization.routes.js'
import { organizationRouter } from './modules/organizations/organization.routes.js'
import { sessionRouter } from './modules/sessions/session.routes.js'
import { userRouter } from './modules/users/user.routes.js'
import { platformRouter } from './modules/platform/platform.routes.js'
import { uploadRouter } from './modules/uploads/upload.routes.js'
import { roleRouter } from './modules/roles/role.routes.js'
import { partnerRouter } from './modules/partners/partner.routes.js'
import { geocodingRouter } from './modules/geocoding/geocoding.routes.js'
import { productRouter } from './modules/products/product.routes.js'
import { openApiDocument } from './openapi.js'
import { logger } from './shared/logger.js'

export function createApp() {
  const app = express()

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(cors({ origin: corsOrigins, credentials: true }))
  app.use(express.json({ limit: '4mb' }))
  app.use(cookieParser())
  app.use(pinoHttp({ logger }))

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))
  app.use('/uploads', express.static('uploads'))
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/organizations', organizationRouter)
  app.use('/api/users', userRouter)
  app.use('/api/sessions', sessionRouter)
  app.use('/api/platform', platformRouter)
  app.use('/api/uploads', uploadRouter)
  app.use('/api/roles', roleRouter)
  app.use('/api/partners', partnerRouter)
  app.use('/api/geocoding', geocodingRouter)
  app.use('/api/products', productRouter)
  app.use('/api/optimization', optimizationRouter)
  app.use(errorHandler)

  return app
}
