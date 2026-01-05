import { randomBytes } from 'crypto'

interface Session {
  id: string
  userId: string
  createdAt: Date
  expiresAt: Date
}

const sessions = new Map<string, Session>()
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export function createSession(userId: string): string {
  const sessionId = randomBytes(32).toString('hex')
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

setInterval(cleanExpiredSessions, 60 * 60 * 1000)
