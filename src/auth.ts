import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { getSession } from './session.js'
import type { Variables } from './types/index.js'
import { SKIP_AUTH } from './config/index.js'

export async function requireAuth(c: Context<{ Variables: Variables }>, next: Next) {
  if (SKIP_AUTH) {
    c.set('userId', 'local-user')
    await next()
    return
  }

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
