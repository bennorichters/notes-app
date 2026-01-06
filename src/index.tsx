import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { compare } from 'bcrypt'
import { authenticator } from 'otplib'
import { requireAuth } from './auth.js'
import { createSession, deleteSession } from './session.js'
import { LoginPage } from './views/LoginPage.js'
import { HomePage } from './views/HomePage.js'
import { NoteDetailPage } from './views/NoteDetailPage.js'
import {
  getLastThreeModifiedNotes,
  getPinnedNotes,
  getNoteByFilename,
  renderMarkdown,
  searchNotes,
  type NoteSearchResult
} from './notes.js'

type Variables = {
  userId: string
}

const app = new Hono<{ Variables: Variables }>()

app.use('/*', serveStatic({ root: './public' }))

app.get('/health', (c) => c.text('OK'))

const USERNAME = process.env.USERNAME || 'admin'
const PASSWORD_HASH = process.env.PASSWORD_HASH || ''
const TOTP_SECRET = process.env.TOTP_SECRET || ''
const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

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

app.get('/note/:filename', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const filename = c.req.param('filename')
  const note = await getNoteByFilename(filename)

  if (!note) {
    return c.text('Note not found', 404)
  }

  return c.html(
    <NoteDetailPage
      username={userId}
      showAuth={!SKIP_AUTH}
      note={{
        title: note.title,
        firstHeader: note.firstHeader,
        lastModified: note.lastModified,
        renderedContent: renderMarkdown(note.content)
      }}
    />
  )
})

app.get('/', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const query = c.req.query('q') || ''

  if (query.trim()) {
    const searchResults = await searchNotes(query, 5)
    return c.html(
      <HomePage
        username={userId}
        showAuth={!SKIP_AUTH}
        query={query}
        searchResults={searchResults}
      />
    )
  } else {
    const lastNotes = await getLastThreeModifiedNotes()
    const pinnedNotes = await getPinnedNotes()
    return c.html(
      <HomePage
        username={userId}
        showAuth={!SKIP_AUTH}
        lastNotes={lastNotes.map((note) => ({
          title: note.title,
          firstHeader: note.firstHeader,
          lastModified: note.lastModified,
          tags: note.tags
        }))}
        pinnedNotes={pinnedNotes.map((note) => ({
          title: note.title,
          firstHeader: note.firstHeader,
          lastModified: note.lastModified,
          tags: note.tags
        }))}
      />
    )
  }
})

const port = parseInt(process.env.PORT || '3000')

serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, (info) => {
  console.log(`Running on http://0.0.0.0:${info.port}`)
})
