import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { compare } from 'bcrypt'
import { requireAuth } from './auth.js'
import { createSession, deleteSession } from './session.js'
import { loginPage, homePage } from './views.js'

type Variables = {
  userId: string
}

const app = new Hono<{ Variables: Variables }>()

const USERNAME = process.env.USERNAME || 'admin'
const PASSWORD_HASH = process.env.PASSWORD_HASH || ''

app.get('/login', (c) => {
  return c.html(loginPage())
})

app.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const username = body.username as string
  const password = body.password as string

  if (!username || !password) {
    return c.html(loginPage('Username and password are required'))
  }

  if (username !== USERNAME) {
    return c.html(loginPage('Invalid username or password'))
  }

  if (!PASSWORD_HASH) {
    return c.html(loginPage('Server configuration error'))
  }

  const isValid = await compare(password, PASSWORD_HASH)

  if (!isValid) {
    return c.html(loginPage('Invalid username or password'))
  }

  const sessionId = createSession(username)

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 7 * 24 * 60 * 60
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

app.get('/', requireAuth, (c) => {
  const userId = c.get('userId') as string
  return c.html(homePage(userId))
})

const port = parseInt(process.env.PORT || '3000')

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Running on http://localhost:${info.port}`)
})
