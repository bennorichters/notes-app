import { readdir, readFile, writeFile, stat, mkdir } from 'fs/promises'
import { join, relative } from 'path'
import { getGit, queueCommitAndPush } from './git.js'
import { extractFirstHeader, extractTags, renderMarkdown } from './markdown.js'

const NOTES_DIR = process.env.NOTES_DIR || './notes'
const LAST_MODIFIED_NOTES_COUNT = 3
const CACHE_TTL_MS = 30 * 1000

export { renderMarkdown }

export interface Note {
  filename: string
  path: string
  firstHeader: string
  content: string
  lastModified: Date
  tags: string[]
  isPinned: boolean
}

interface NotesCache {
  notes: Note[]
  timestamp: number
}

let cache: NotesCache | null = null

function isCacheValid(): boolean {
  if (!cache) return false
  return Date.now() - cache.timestamp < CACHE_TTL_MS
}

function invalidateCache(): void {
  cache = null
}

export async function getLastThreeModifiedNotes(): Promise<Note[]> {
  try {
    const notes = await getAllNotes()
    return notes.slice(0, LAST_MODIFIED_NOTES_COUNT)
  } catch (error) {
    console.error(`Error getting last ${LAST_MODIFIED_NOTES_COUNT} modified notes from ${NOTES_DIR}:`, error)
    return []
  }
}

export async function getPinnedNotes(): Promise<Note[]> {
  try {
    const notes = await getAllNotes()
    const pinnedNotes = notes.filter(note => note.isPinned)
    return pinnedNotes.sort((a, b) => a.filename.localeCompare(b.filename))
  } catch (error) {
    console.error(`Error getting pinned notes from ${NOTES_DIR}:`, error)
    return []
  }
}

export async function getNoteByFilename(filename: string): Promise<Note | null> {
  try {
    const notes = await getAllNotes()
    return notes.find(note => note.filename === filename) || null
  } catch (error) {
    console.error(`Error getting note by filename "${filename}" from ${NOTES_DIR}:`, error)
    return null
  }
}

export async function getAllNotes(): Promise<Note[]> {
  if (isCacheValid() && cache) {
    return cache.notes
  }

  try {
    const files = await readdir(NOTES_DIR, { recursive: true })
    const mdFiles = files.filter(f => typeof f === 'string' && f.endsWith('.md'))
    const git = getGit()

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
        console.error(`Error reading file "${file}" from ${NOTES_DIR}:`, error)
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
        console.error(`Git log failed for "${file}" in ${NOTES_DIR}:`, error)
        try {
          const stats = await stat(filePath)
          lastModified = stats.mtime
        } catch (statError) {
          console.error(`Error getting file stats for "${file}" in ${NOTES_DIR}:`, statError)
        }
      }

      const tags = extractTags(content)
      const filename = fileName.replace('.md', '')

      notes.push({
        filename,
        path: filePath,
        firstHeader: firstHeader || filename,
        content,
        lastModified,
        tags,
        isPinned: tags.includes('pinned')
      })
    }

    const sortedNotes = notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

    cache = {
      notes: sortedNotes,
      timestamp: Date.now()
    }

    return sortedNotes
  } catch (error) {
    console.error(`Error getting all notes from ${NOTES_DIR}:`, error)
    return []
  }
}

export async function updateNote(filename: string, content: string): Promise<void> {
  const note = await getNoteByFilename(filename)
  if (!note) {
    throw new Error(`Note not found: ${filename}`)
  }

  await writeFile(note.path, content, 'utf-8')
  invalidateCache()

  const relativePath = relative(NOTES_DIR, note.path)
  queueCommitAndPush(relativePath, `Update ${filename}`)
}

export async function createNote(content: string): Promise<string> {
  const newDir = join(NOTES_DIR, 'new')

  try {
    await mkdir(newDir, { recursive: true })
  } catch (error) {
    console.error(`Error creating new directory in ${NOTES_DIR}:`, error)
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  const baseFilename = `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`
  let filename = `${baseFilename}.md`
  let filePath = join(newDir, filename)
  let counter = 2

  while (true) {
    try {
      await stat(filePath)
      filename = `${baseFilename}_${counter}.md`
      filePath = join(newDir, filename)
      counter++
    } catch {
      break
    }
  }

  await writeFile(filePath, content, 'utf-8')
  invalidateCache()

  queueCommitAndPush(`new/${filename}`, `Create ${filename}`)

  return filename.replace('.md', '')
}
