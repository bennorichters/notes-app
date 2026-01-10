import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'
import { NoteCard } from '../components/NoteCard.js'
import { TodoCard } from '../components/TodoCard.js'
import type { NoteSearchResult } from '../search.js'
import type { NoteCardData, TodoNoteData } from '../types/index.js'

type HomePageProps = {
  username: string
  showAuth: boolean
  lastNotes?: NoteCardData[]
  pinnedNotes?: NoteCardData[]
  todoNotes?: TodoNoteData[]
  query?: string
  searchResults?: NoteSearchResult[]
  error?: string
}

export const HomePage: FC<HomePageProps> = ({
  username,
  showAuth,
  lastNotes,
  pinnedNotes,
  todoNotes,
  query,
  searchResults,
  error
}) => {
  return (
    <Layout title="Notes">
      <Header username={username} showAuth={showAuth} />
      <div class="content">
        <div class="search-and-create">
          <input
            type="text"
            name="q"
            placeholder="Search notes, tags..."
            value={query || ''}
            class="search-input"
            form="search-form"
          />
          <div class="button-group">
            <form method="get" action="/" id="search-form" class="search-form">
              <button type="submit" class="search-button">🔍</button>
            </form>
            {query && (
              <a href="/" class="clear-button">Clear</a>
            )}
            <a href="/note/new" class="btn btn-primary new-note-btn">+</a>
            <form method="post" action="/sync" class="sync-form">
              <button type="submit" class="btn btn-secondary sync-btn" title="Synchronize">↻</button>
            </form>
          </div>
        </div>
        {error && <div class="error-message">{error}</div>}

        {searchResults ? (
          <>
            <h2 class="section-title">Search Results</h2>
            {searchResults.length > 0 ? (
              searchResults.map((result) => (
                <NoteCard
                  title={result.note.filename}
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
            {todoNotes && todoNotes.length > 0 && (
              <>
                <h2 class="section-title">TODO</h2>
                {todoNotes.map((todoNote) => (
                  <TodoCard
                    noteFilename={todoNote.noteFilename}
                    noteTitle={todoNote.noteTitle}
                    todos={todoNote.todos}
                  />
                ))}
              </>
            )}
            {pinnedNotes && pinnedNotes.length > 0 && (
              <>
                <h2 class="section-title">Pinned Notes</h2>
                {pinnedNotes.map((note) => (
                  <NoteCard
                    title={note.title}
                    firstHeader={note.firstHeader}
                    lastModified={note.lastModified}
                    tags={note.tags}
                  />
                ))}
              </>
            )}
            {lastNotes && lastNotes.length > 0 ? (
              <>
                <h2 class="section-title">Last Modified Notes</h2>
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
