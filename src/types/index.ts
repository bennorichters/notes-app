import type { TodoItem } from '../todos.js'

export type Variables = {
  userId: string
}

export type NoteCardData = {
  title: string
  firstHeader: string
  lastModified: Date
  tags: string[]
}

export type TodoNoteData = {
  noteFilename: string
  noteTitle: string
  todos: TodoItem[]
}
