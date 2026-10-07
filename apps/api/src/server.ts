import { createApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './database/client.js'
import { logger } from './shared/logger.js'

const app = createApp()
const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info({ port: env.PORT }, 'Asyne API listening')
})

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down')
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
