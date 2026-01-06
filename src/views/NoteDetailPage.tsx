import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'

type NoteDetailPageProps = {
  username: string
  showAuth: boolean
  note: {
    title: string
    firstHeader: string
    lastModified: Date
    renderedContent: string
  }
}

export const NoteDetailPage: FC<NoteDetailPageProps> = ({ username, showAuth, note }) => {
  return (
    <Layout title={`${note.firstHeader} - Notes`}>
      <Header username={username} showAuth={showAuth} />
      <div class="note-header-actions">
        <a href="/" class="back-link">
          ← Back to Notes
        </a>
        <a href={`/note/${note.title}/edit`} class="btn btn-primary">
          Edit
        </a>
      </div>
      <div class="content">
        <div class="note-meta">
          Modified: {note.lastModified.toLocaleString()} - {note.title}.md
        </div>
        <div class="markdown-content" dangerouslySetInnerHTML={{ __html: note.renderedContent }} />
      </div>
    </Layout>
  )
}
