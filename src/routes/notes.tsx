import type { Hono } from 'hono'
import { requireAuth } from '../auth.js'
import { getNoteByFilename, renderMarkdown, updateNote, createNote } from '../notes.js'
import { NewNotePage } from '../views/NewNotePage.js'
import { NoteDetailPage } from '../views/NoteDetailPage.js'
import { EditNotePage } from '../views/EditNotePage.js'
import { ErrorPage } from '../views/ErrorPage.js'
import type { Variables } from '../types/index.js'
import { SKIP_AUTH } from '../config/index.js'
import { logError } from '../logger.js'

export function registerNoteRoutes(app: Hono<{ Variables: Variables }>) {
  app.get('/note/new', requireAuth, async (c) => {
    const userId = c.get('userId') as string
    return c.html(
      <NewNotePage
        username={userId}
        showAuth={!SKIP_AUTH}
      />
    )
  })

  app.post('/note/new', requireAuth, async (c) => {
    const userId = c.get('userId') as string
    const body = await c.req.parseBody()
    const content = body.content as string

    if (!content || content.trim() === '') {
      return c.html(
        <NewNotePage
          username={userId}
          showAuth={!SKIP_AUTH}
          content={content}
          error="Note content cannot be empty"
        />
      )
    }

    try {
      const filename = await createNote(content)
      return c.redirect(`/note/${filename}`)
    } catch (error) {
      logError('createNote', error, { userId })
      return c.html(
        <NewNotePage
          username={userId}
          showAuth={!SKIP_AUTH}
          content={content}
          error={`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`}
        />
      )
    }
  })

  app.get('/note/:filename', requireAuth, async (c) => {
    const userId = c.get('userId') as string
    const filename = c.req.param('filename')
    const note = await getNoteByFilename(filename)

    if (!note) {
      return c.html(<ErrorPage
        username={userId}
        showAuth={!SKIP_AUTH}
        title="Note Not Found"
        message={`The note "${filename}" could not be found.`}
        statusCode={404}
      />, 404)
    }

    return c.html(
      <NoteDetailPage
        username={userId}
        showAuth={!SKIP_AUTH}
        note={{
          title: note.filename,
          firstHeader: note.firstHeader,
          lastModified: note.lastModified,
          renderedContent: renderMarkdown(note.content)
        }}
      />
    )
  })

  app.get('/note/:filename/edit', requireAuth, async (c) => {
    const userId = c.get('userId') as string
    const filename = c.req.param('filename')
    const note = await getNoteByFilename(filename)

    if (!note) {
      return c.html(<ErrorPage
        username={userId}
        showAuth={!SKIP_AUTH}
        title="Note Not Found"
        message={`The note "${filename}" could not be found.`}
        statusCode={404}
      />, 404)
    }

    return c.html(
      <EditNotePage
        username={userId}
        showAuth={!SKIP_AUTH}
        note={{
          title: note.filename,
          firstHeader: note.firstHeader,
          content: note.content
        }}
      />
    )
  })

  app.post('/note/:filename/edit', requireAuth, async (c) => {
    const userId = c.get('userId') as string
    const filename = c.req.param('filename')
    const body = await c.req.parseBody()
    const content = body.content as string

    if (!content || content.trim() === '') {
      const note = await getNoteByFilename(filename)
      if (!note) {
        return c.html(<ErrorPage
          username={userId}
          showAuth={!SKIP_AUTH}
          title="Note Not Found"
          message={`The note "${filename}" could not be found.`}
          statusCode={404}
        />, 404)
      }
      return c.html(
        <EditNotePage
          username={userId}
          showAuth={!SKIP_AUTH}
          note={{
            title: note.filename,
            firstHeader: note.firstHeader,
            content: note.content
          }}
          error="Note content cannot be empty"
        />
      )
    }

    try {
      await updateNote(filename, content)
      return c.redirect(`/note/${filename}`)
    } catch (error) {
      logError('updateNote', error, { userId, filename })
      const note = await getNoteByFilename(filename)
      if (!note) {
        return c.html(<ErrorPage
          username={userId}
          showAuth={!SKIP_AUTH}
          title="Note Not Found"
          message={`The note "${filename}" could not be found.`}
          statusCode={404}
        />, 404)
      }
      return c.html(
        <EditNotePage
          username={userId}
          showAuth={!SKIP_AUTH}
          note={{
            title: note.filename,
            firstHeader: note.firstHeader,
            content: content
          }}
          error={`Failed to save note: ${error instanceof Error ? error.message : 'Unknown error'}`}
        />
      )
    }
  })
}
