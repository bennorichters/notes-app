import type { FC } from 'hono/jsx'
import { Layout } from '../components/Layout.js'
import { Header } from '../components/Header.js'

type NewNotePageProps = {
  username: string
  showAuth: boolean
  content?: string
  error?: string
}

export const NewNotePage: FC<NewNotePageProps> = ({
  username,
  showAuth,
  content,
  error
}) => {
  return (
    <Layout title="New Note - Notes">
      <Header username={username} showAuth={showAuth} />
      <a href="/" class="back-link">
        ← Cancel
      </a>
      <div class="content">
        <h1>New Note</h1>
        <div class="note-meta">File will be created when you save</div>
        {error && <div class="error-message">{error}</div>}
        <form method="post" class="edit-form">
          <textarea
            name="content"
            class="note-editor"
            required
          >{content || ''}</textarea>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
