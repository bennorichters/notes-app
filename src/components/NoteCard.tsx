import type { FC } from 'hono/jsx'

type NoteCardProps = {
  title: string
  firstHeader: string
  lastModified: Date
  tags: string[]
}

export const NoteCard: FC<NoteCardProps> = ({ title, firstHeader, lastModified, tags }) => {
  return (
    <a href={`/note/${title}`} class="note-link">
      <div class="note-card">
        <div class="note-title">
          {firstHeader}
        </div>
        <div class="note-subtitle">
          Modified: {lastModified.toLocaleString()} - {title}.md
        </div>
        {tags.length > 0 && (
          <div class="tag-list">
            Tags: {tags.map(tag =>
              <span class="tag-badge">{tag}</span>
            )}
          </div>
        )}
      </div>
    </a>
  )
}
