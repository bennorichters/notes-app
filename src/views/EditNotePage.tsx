import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'

type EditNotePageProps = {
  username: string
  showAuth: boolean
  note: {
    title: string
    firstHeader: string
    content: string
  }
  error?: string
}

export const EditNotePage: FC<EditNotePageProps> = ({
  username,
  showAuth,
  note,
  error
}) => {
  return (
    <Layout title={`Edit ${note.firstHeader} - Notes`}>
      <Header username={username} showAuth={showAuth} />
      <a href={`/note/${note.title}`} class="back-link">
        ← Cancel
      </a>
      <div class="content">
        <h1>Edit Note</h1>
        <div class="note-meta">{note.title}.md</div>
        {error && <div class="error-message">{error}</div>}
        <form method="post" class="edit-form">
          <textarea
            name="content"
            class="note-editor"
            required
          >{note.content}</textarea>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              Save Changes
            </button>
            <a href={`/note/${note.title}`} class="btn btn-secondary">
              Cancel
            </a>
          </div>
        </form>
      </div>
    </Layout>
  )
}
