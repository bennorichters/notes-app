import { simpleGit } from 'simple-git'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { marked } from 'marked'
import Fuse from 'fuse.js'

const NOTES_DIR = process.env.NOTES_DIR || './notes'

marked.setOptions({
  breaks: true,
  gfm: true
})

function extractFirstHeader(content: string): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '')
    }
  }
  return ''
}

function extractTags(content: string): string[] {
  const lines = content.split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim()
    if (trimmed === '') continue
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
      return trimmed.split(':').filter(tag => tag.length > 0)
    }
    break
  }
  return []
}

export function renderMarkdown(content: string): string {
  return marked(content, { async: false }) as string
}

export interface Note {
  filename: string
  path: string
  title: string
  firstHeader: string
  content: string
  lastModified: Date
  tags: string[]
}

export async function getLastModifiedNote(): Promise<Note | null> {
  try {
    const notes = await getAllNotes()
    return notes.length > 0 ? notes[0] : null
  } catch (error) {
    console.error('Error getting last modified note:', error)
    return null
  }
}

export async function getLastThreeModifiedNotes(): Promise<Note[]> {
  try {
    const notes = await getAllNotes()
    return notes.slice(0, 3)
  } catch (error) {
    console.error('Error getting last three modified notes:', error)
    return []
  }
}

export async function getNoteByFilename(filename: string): Promise<Note | null> {
  try {
    const notes = await getAllNotes()
    return notes.find(note => note.title === filename) || null
  } catch (error) {
    console.error('Error getting note by filename:', error)
    return null
  }
}

export async function getAllNotes(): Promise<Note[]> {
  try {
    const files = await readdir(NOTES_DIR, { recursive: true })
    const mdFiles = files.filter(f => typeof f === 'string' && f.endsWith('.md'))
    const git = simpleGit(NOTES_DIR, {
      config: [`safe.directory=${NOTES_DIR}`]
    })

    const notes: Note[] = []

    for (const file of mdFiles) {
      const filePath = join(NOTES_DIR, file)
      const fileName = file.split('/').pop() || file
      let firstHeader = ''
      let content = ''
      let lastModified = new Date()

      try {
        content = await readFile(filePath, 'utf-8')
        firstHeader = extractFirstHeader(content)
      } catch (error) {
        console.error(`Error reading file ${file}:`, error)
      }

      try {
        const log = await git.log({ file, maxCount: 1 })
        if (log.latest) {
          lastModified = new Date(log.latest.date)
        } else {
          const stats = await stat(filePath)
          lastModified = stats.mtime
        }
      } catch (error) {
        console.error(`Git log failed for ${file}:`, error)
        try {
          const stats = await stat(filePath)
          lastModified = stats.mtime
        } catch (statError) {
          console.error(`Error getting file stats for ${file}:`, statError)
        }
      }

      notes.push({
        filename: fileName,
        path: filePath,
        title: fileName.replace('.md', ''),
        firstHeader: firstHeader || fileName.replace('.md', ''),
        content,
        lastModified,
        tags: extractTags(content)
      })
    }

    return notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  } catch (error) {
    console.error('Error getting all notes:', error)
    return []
  }
}

export interface SearchMatch {
  indices: readonly [number, number][]
  value: string
  key?: string
}

export interface NoteSearchResult {
  note: Note
  matches: SearchMatch[]
  score: number
}

export async function searchNotes(
  query: string,
  limit: number = 5
): Promise<NoteSearchResult[]> {
  if (!query || query.trim() === '') {
    return []
  }

  const notes = await getAllNotes()

  const fuse = new Fuse(notes, {
    keys: [
      { name: 'tags', weight: 3 },
      { name: 'firstHeader', weight: 2 },
      { name: 'title', weight: 1.5 },
      { name: 'content', weight: 1 }
    ],
    threshold: 0.2,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    ignoreLocation: true,
    isCaseSensitive: false
  })

  const results = fuse.search(query)

  return results.slice(0, limit).map(result => ({
    note: result.item,
    matches: (result.matches || []).map(match => ({
      indices: match.indices || [],
      value: match.value || '',
      key: match.key
    })),
    score: result.score || 0
  }))
}
