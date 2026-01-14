import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { getGit } from './git.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerNoteRoutes } from './routes/notes.js'
import { registerHomeRoutes } from './routes/home.js'
import type { Variables } from './types/index.js'
import { PORT, NOTES_DIR, validateConfig } from './config/index.js'

const app = new Hono<{ Variables: Variables }>()

app.use('/*', serveStatic({ root: './public' }))

app.get('/health', (c) => c.text('OK'))

registerAuthRoutes(app)
registerNoteRoutes(app)
registerHomeRoutes(app)

async function startServer() {
  console.log("Start server")
  validateConfig()

  try {
    const git = getGit()
    await git.checkIsRepo()
    console.log(`Git repository verified at ${NOTES_DIR}`)
  } catch (error) {
    console.error(`FATAL: ${NOTES_DIR} is not a git repository`)
    console.error('The docker-entrypoint.sh should have initialized this.')
    console.error('Error:', error)
    process.exit(1)
  }

  serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
    console.log(`Running on http://0.0.0.0:${info.port}`)
  })
}

startServer()
