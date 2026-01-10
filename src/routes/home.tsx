import type { Hono } from 'hono'
import { requireAuth } from '../auth.js'
import { pullFromUpstream } from '../git.js'
import { getAllNotes, invalidateCache } from '../notes.js'
import { searchNotes } from '../search.js'
import { buildHomePageData } from '../services/homePageService.js'
import { HomePage } from '../views/HomePage.js'
import type { Variables } from '../types/index.js'
import { SKIP_AUTH, SEARCH_RESULTS_LIMIT } from '../config/index.js'

export function registerHomeRoutes(app: Hono<{ Variables: Variables }>) {
  app.post('/sync', requireAuth, async (c) => {
    try {
      await pullFromUpstream()
      invalidateCache()
      return c.redirect('/')
    } catch (error) {
      console.error('Sync failed:', error)
      const userId = c.get('userId') as string
      const { lastNotes, pinnedNotes, todoNotes } = await buildHomePageData()
      return c.html(
        <HomePage
          username={userId}
          showAuth={!SKIP_AUTH}
          lastNotes={lastNotes}
          pinnedNotes={pinnedNotes}
          todoNotes={todoNotes}
          error="Failed to sync from upstream"
        />
      )
    }
  })

  app.get('/', requireAuth, async (c) => {
    const userId = c.get('userId') as string
    const query = c.req.query('q') || ''

    if (query.trim()) {
      const allNotes = await getAllNotes()
      const searchResults = searchNotes(allNotes, query, SEARCH_RESULTS_LIMIT)
      return c.html(
        <HomePage
          username={userId}
          showAuth={!SKIP_AUTH}
          query={query}
          searchResults={searchResults}
        />
      )
    } else {
      const { lastNotes, pinnedNotes, todoNotes } = await buildHomePageData()
      return c.html(
        <HomePage
          username={userId}
          showAuth={!SKIP_AUTH}
          lastNotes={lastNotes}
          pinnedNotes={pinnedNotes}
          todoNotes={todoNotes}
        />
      )
    }
  })
}
