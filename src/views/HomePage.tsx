import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'

type HomePageProps = {
  username: string
  showAuth: boolean
  lastNotes: { title: string; firstHeader: string; lastModified: Date }[]
}

export const HomePage: FC<HomePageProps> = ({ username, showAuth, lastNotes }) => {
  return (
    <Layout title="Notes">
      <Header username={username} showAuth={showAuth} />
      <div class="content">
        {lastNotes.length > 0 ? (
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
      </div>
    </Layout>
  )
}
