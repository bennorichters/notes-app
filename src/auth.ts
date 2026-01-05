import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { getSession } from './session.js'

type Variables = {
  userId: string
}

export async function requireAuth(c: Context<{ Variables: Variables }>, next: Next) {
  const sessionId = getCookie(c, 'session')

  if (!sessionId) {
    return c.redirect('/login')
  }

  const session = getSession(sessionId)

  if (!session) {
    return c.redirect('/login')
  }

  c.set('userId', session.userId)
  await next()
}
