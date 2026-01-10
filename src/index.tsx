import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { initGitRepository, initGitConfig } from './git.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerNoteRoutes } from './routes/notes.js'
import { registerHomeRoutes } from './routes/home.js'
import type { Variables } from './types/index.js'
import { PORT, validateConfig } from './config/index.js'

const app = new Hono<{ Variables: Variables }>()

app.use('/*', serveStatic({ root: './public' }))

app.get('/health', (c) => c.text('OK'))

registerAuthRoutes(app)
registerNoteRoutes(app)
registerHomeRoutes(app)

async function startServer() {
  validateConfig()

  try {
    await initGitRepository()
    initGitConfig()
  } catch (error) {
    console.error('Failed to initialize git repository:', error)
    process.exit(1)
  }

  serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
    console.log(`Running on http://0.0.0.0:${info.port}`)
  })
}

startServer()
