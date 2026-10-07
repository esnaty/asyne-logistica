import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../shared/http-error.js'
import { logger } from '../shared/logger.js'

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'VALIDATION_ERROR',
      details: error.flatten(),
    })
    return
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.code, message: error.message })
    return
  }

  logger.error({ error }, 'Unhandled request error')
  response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
}
