import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().default('postgresql://asyne:asyne@localhost:5432/asyne'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  OPTIMIZER_URL: z.string().url().default('http://localhost:8000'),
  ACCESS_TOKEN_SECRET: z.string().min(32).default('development-only-access-token-secret-change-me'),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
  GEOAPIFY_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
export const corsOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
