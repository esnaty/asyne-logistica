import { Algorithm, hash, verify } from '@node-rs/argon2'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../../config/env.js'

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60

export async function hashPassword(password: string) {
  return hash(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  })
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password)
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function createAccessToken(sessionId: string) {
  const payload = Buffer.from(
    JSON.stringify({ sid: sessionId, exp: Math.floor(Date.now() / 1_000) + ACCESS_TOKEN_TTL_SECONDS }),
  ).toString('base64url')
  const signature = createHmac('sha256', env.ACCESS_TOKEN_SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyAccessToken(token: string) {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = createHmac('sha256', env.ACCESS_TOKEN_SECRET).update(payload).digest()
  let received: Buffer
  try {
    received = Buffer.from(signature, 'base64url')
  } catch {
    return null
  }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      sid?: string
      exp?: number
    }
    if (!decoded.sid || !decoded.exp || decoded.exp <= Math.floor(Date.now() / 1_000)) return null
    return decoded.sid
  } catch {
    return null
  }
}
