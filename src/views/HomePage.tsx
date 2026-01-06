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

function highlightText(text: string, indices: readonly [number, number][]): any {
  if (!indices || indices.length === 0) {
    return text
  }

  const parts: any[] = []
  let lastIndex = 0

  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0])

  for (const [start, end] of sortedIndices) {
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start))
    }
    parts.push(<mark>{text.substring(start, end + 1)}</mark>)
    lastIndex = end + 1
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts
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
              searchResults.map((result) => {
                const titleMatch = result.matches.find(m => m.key === 'title')
                const headerMatch = result.matches.find(m => m.key === 'firstHeader')
                const contentMatch = result.matches.find(m => m.key === 'content')
                const tagsMatch = result.matches.find(m => m.key === 'tags')

                return (
                  <a href={`/note/${result.note.title}`} class="note-link">
                    <div class="note-card">
                      <div style="font-size: 1.1rem; color: #2a2b2a; font-weight: 500;">
                        {headerMatch
                          ? highlightText(result.note.firstHeader, headerMatch.indices)
                          : result.note.firstHeader}
                      </div>
                      <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                        Modified: {result.note.lastModified.toLocaleString()} -{' '}
                        {titleMatch
                          ? highlightText(result.note.title, titleMatch.indices)
                          : result.note.title}.md
                      </div>
                      {tagsMatch && result.note.tags.length > 0 && (
                        <div style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">
                          Tags: {result.note.tags.map(tag =>
                            <span class="tag-badge">{tag}</span>
                          )}
                        </div>
                      )}
                      {contentMatch && (
                        <div style="font-size: 0.9rem; color: #444; margin-top: 0.5rem;">
                          ...{highlightText(
                            contentMatch.value.substring(
                              Math.max(0, contentMatch.indices[0][0] - 40),
                              Math.min(contentMatch.value.length, contentMatch.indices[0][1] + 100)
                            ),
                            contentMatch.indices.map(([start, end]) => [
                              Math.max(0, start - Math.max(0, contentMatch.indices[0][0] - 40)),
                              Math.max(0, end - Math.max(0, contentMatch.indices[0][0] - 40))
                            ] as [number, number])
                          )}...
                        </div>
                      )}
                    </div>
                  </a>
                )
              })
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
