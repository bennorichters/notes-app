import { simpleGit } from 'simple-git'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { marked } from 'marked'

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
    const files = await readdir(NOTES_DIR)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    const git = simpleGit(NOTES_DIR, {
      config: [`safe.directory=${NOTES_DIR}`]
    })

    const notes: Note[] = []

    for (const file of mdFiles) {
      const filePath = join(NOTES_DIR, file)
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
          console.log(`Git log for ${file}: ${log.latest.date}`)
        } else {
          console.log(`No git history for ${file}, using filesystem mtime`)
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
        filename: file,
        path: filePath,
        title: file.replace('.md', ''),
        firstHeader: firstHeader || file.replace('.md', ''),
        content,
        lastModified
      })
    }

    return notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  } catch (error) {
    console.error('Error getting all notes:', error)
    return []
  }
}
