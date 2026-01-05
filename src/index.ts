import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'

const app = new Hono()

app.get('/', (c) => c.html('<h1>Notes</h1>'))

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Running on http://localhost:${info.port}`)
})
