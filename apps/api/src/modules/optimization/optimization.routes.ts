import { Router } from 'express'
import axios from 'axios'
import { env } from '../../config/env.js'
import { optimizeRouteSchema } from './optimization.schema.js'
import { requireAuthentication } from '../../middleware/authentication.js'

export const optimizationRouter = Router()

optimizationRouter.use(requireAuthentication)

optimizationRouter.post('/routes', async (request, response) => {
  const payload = optimizeRouteSchema.parse(request.body)
  const result = await axios.post(`${env.OPTIMIZER_URL}/v1/routes/optimize`, payload, {
    timeout: 30_000,
  })

  response.status(200).json(result.data)
})
