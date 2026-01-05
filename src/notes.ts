import { simpleGit } from 'simple-git'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const NOTES_DIR = process.env.NOTES_DIR || './notes'

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

export interface Note {
  filename: string
  path: string
  title: string
  firstHeader: string
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

export async function getAllNotes(): Promise<Note[]> {
  try {
    const files = await readdir(NOTES_DIR)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    const git = simpleGit(NOTES_DIR)

    const notes: Note[] = []

    for (const file of mdFiles) {
      const filePath = join(NOTES_DIR, file)
      let firstHeader = ''
      try {
        const content = await readFile(filePath, 'utf-8')
        firstHeader = extractFirstHeader(content)
      } catch (error) {
        console.error(`Error reading file ${file}:`, error)
      }

      try {
        const log = await git.log({ file, maxCount: 1 })
        notes.push({
          filename: file,
          path: filePath,
          title: file.replace('.md', ''),
          firstHeader: firstHeader || file.replace('.md', ''),
          lastModified: log.latest ? new Date(log.latest.date) : new Date()
        })
      } catch (error) {
        notes.push({
          filename: file,
          path: filePath,
          title: file.replace('.md', ''),
          firstHeader: firstHeader || file.replace('.md', ''),
          lastModified: new Date()
        })
      }
    }

    return notes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
  } catch (error) {
    console.error('Error getting all notes:', error)
    return []
  }
}
