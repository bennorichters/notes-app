import type { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { compare } from 'bcrypt'
import { authenticator } from 'otplib'
import { createSession, deleteSession } from '../session.js'
import { LoginPage } from '../views/LoginPage.js'
import type { Variables } from '../types/index.js'
import {
  USERNAME,
  PASSWORD_HASH,
  TOTP_SECRET,
  SKIP_AUTH,
  SESSION_MAX_AGE_SECONDS
} from '../config/index.js'

export function registerAuthRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/login', (c) => {
    return c.html(<LoginPage />)
  })

  app.post('/login', async (c) => {
    const body = await c.req.parseBody()
    const username = body.username as string
    const password = body.password as string
    const totp = body.totp as string

    if (!username || !password || !totp) {
      return c.html(<LoginPage error="All fields are required" />)
    }

    if (username !== USERNAME) {
      return c.html(<LoginPage error="Invalid credentials" />)
    }

    if (!PASSWORD_HASH) {
      return c.html(<LoginPage error="Server configuration error" />)
    }

    const isValid = await compare(password, PASSWORD_HASH)

    if (!isValid) {
      return c.html(<LoginPage error="Invalid credentials" />)
    }

    if (!SKIP_AUTH) {
      if (!TOTP_SECRET) {
        return c.html(<LoginPage error="Server configuration error" />)
      }

      const isTotpValid = authenticator.verify({ token: totp, secret: TOTP_SECRET })

      if (!isTotpValid) {
        return c.html(<LoginPage error="Invalid credentials" />)
      }
    }

    const sessionId = createSession(username)

    setCookie(c, 'session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: SESSION_MAX_AGE_SECONDS
    })

    return c.redirect('/')
  })

  app.get('/logout', (c) => {
    const sessionId = getCookie(c, 'session')

    if (sessionId) {
      deleteSession(sessionId)
    }

    deleteCookie(c, 'session')
    return c.redirect('/login')
  })
}
