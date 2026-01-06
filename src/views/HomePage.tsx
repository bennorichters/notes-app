import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'
import type { NoteSearchResult } from '../notes.js'

type HomePageProps = {
  username: string
  showAuth: boolean
  lastNotes?: { title: string; firstHeader: string; lastModified: Date }[]
  query?: string
  searchResults?: NoteSearchResult[]
}

export const HomePage: FC<HomePageProps> = ({
  username,
  showAuth,
  lastNotes,
  query,
  searchResults
}) => {
  return (
    <Layout title="Notes">
      <Header username={username} showAuth={showAuth} />
      <div class="content">
        <form method="get" action="/" class="search-form">
          <input
            type="text"
            name="q"
            placeholder="Search notes, tags..."
            value={query || ''}
            class="search-input"
          />
          <button type="submit" class="search-button">Search</button>
          {query && (
            <a href="/" class="clear-button">Clear</a>
          )}
        </form>

        {searchResults ? (
          <>
            <h2 style="color: #1e152a; margin-bottom: 1rem;">Search Results</h2>
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <a href={`/note/${result.note.title}`} class="note-link">
                  <div class="note-card">
                    <div style="font-size: 1.1rem; color: #2a2b2a; font-weight: 500;">
                      {result.note.firstHeader}
                    </div>
                    <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                      Modified: {result.note.lastModified.toLocaleString()} - {result.note.title}.md
                    </div>
                    {result.note.tags.length > 0 && (
                      <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                        Tags: {result.note.tags.map(tag =>
                          <span class="tag-badge">{tag}</span>
                        )}
                      </div>
                    )}
                  </div>
                </a>
              ))
            ) : (
              <p>No results found for "{query}"</p>
            )}
          </>
        ) : (
          <>
            {lastNotes && lastNotes.length > 0 ? (
              <>
                <h2 style="color: #1e152a; margin-bottom: 1rem;">Last Modified Notes</h2>
                {lastNotes.map((note) => (
                  <a href={`/note/${note.title}`} class="note-link">
                    <div class="note-card">
                      <div style="font-size: 1.1rem; color: #2a2b2a; font-weight: 500;">
                        {note.firstHeader}
                      </div>
                      <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                        Modified: {note.lastModified.toLocaleString()} - {note.title}.md
                      </div>
                    </div>
                  </a>
                ))}
              </>
            ) : (
              <p>No notes found. Create your first note!</p>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
