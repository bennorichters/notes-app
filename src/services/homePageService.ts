import { getAllNotes, type Note } from '../notes.js'
import { getNotesWithTodos } from '../todos.js'
import type { NoteCardData, TodoNoteData } from '../types/index.js'
import { LAST_MODIFIED_NOTES_COUNT } from '../config/index.js'

export interface HomePageData {
  lastNotes: NoteCardData[]
  pinnedNotes: NoteCardData[]
  todoNotes: TodoNoteData[]
}

function toNoteCardData(note: Note): NoteCardData {
  return {
    title: note.filename,
    firstHeader: note.firstHeader,
    lastModified: note.lastModified,
    tags: note.tags
  }
}

export async function buildHomePageData(): Promise<HomePageData> {
  const allNotes = await getAllNotes()
  const lastNotes = allNotes.slice(0, LAST_MODIFIED_NOTES_COUNT)
  const pinnedNotes = allNotes
    .filter(note => note.isPinned)
    .sort((a, b) => a.filename.localeCompare(b.filename))
  const notesWithTodos = getNotesWithTodos(allNotes)
  const todoNotes = notesWithTodos.map(nwt => ({
    noteFilename: nwt.note.filename,
    noteTitle: nwt.note.firstHeader,
    todos: nwt.todos
  }))

  return {
    lastNotes: lastNotes.map(toNoteCardData),
    pinnedNotes: pinnedNotes.map(toNoteCardData),
    todoNotes
  }
}
