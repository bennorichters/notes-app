import { randomBytes } from 'crypto'
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_CLEANUP_INTERVAL_MS,
  SESSION_ID_BYTES
} from './config/index.js'

interface Session {
  id: string
  userId: string
  createdAt: Date
  expiresAt: Date
}

const SESSION_DURATION_MS = SESSION_MAX_AGE_SECONDS * 1000

const sessions = new Map<string, Session>()

export function createSession(userId: string): string {
  const sessionId = randomBytes(SESSION_ID_BYTES).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS)

  sessions.set(sessionId, {
    id: sessionId,
    userId,
    createdAt: now,
    expiresAt
  })

  return sessionId
}

export function getSession(sessionId: string): Session | null {
  const session = sessions.get(sessionId)

  if (!session) {
    return null
  }

  if (new Date() > session.expiresAt) {
    sessions.delete(sessionId)
    return null
  }

  return session
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}

export function cleanExpiredSessions(): void {
  const now = new Date()
  for (const [id, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(id)
    }
  }
}

setInterval(cleanExpiredSessions, SESSION_CLEANUP_INTERVAL_MS)
