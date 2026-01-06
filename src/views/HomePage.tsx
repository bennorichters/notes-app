import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'
import { NoteCard } from '../components/NoteCard.js'
import type { NoteSearchResult } from '../notes.js'

type HomePageProps = {
  username: string
  showAuth: boolean
  lastNotes?: { title: string; firstHeader: string; lastModified: Date; tags: string[] }[]
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
                <NoteCard
                  title={result.note.title}
                  firstHeader={result.note.firstHeader}
                  lastModified={result.note.lastModified}
                  tags={result.note.tags}
                />
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
                  <NoteCard
                    title={note.title}
                    firstHeader={note.firstHeader}
                    lastModified={note.lastModified}
                    tags={note.tags}
                  />
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
