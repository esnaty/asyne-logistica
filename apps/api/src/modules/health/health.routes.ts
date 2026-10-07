import { Router } from 'express'
import { sql } from 'drizzle-orm'
import { db } from '../../database/client.js'

export const healthRouter = Router()

healthRouter.get('/', async (_request, response) => {
  await db.execute(sql`select 1`)
  response.json({ status: 'ok', database: 'connected' })
})
