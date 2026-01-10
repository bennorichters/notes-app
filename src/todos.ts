import type { Note } from './notes.js'

export interface TodoItem {
  dueDate: Date | null
  dueDateString: string
  description: string
  isDone: boolean
  isValid: boolean
}

export interface NoteWithTodos {
  note: Note
  todos: TodoItem[]
  earliestDueDate: Date | null
}

const TODO_PATTERN = /^[\t ]*-\s*TODO\[([^\]]*)\]\s*(\S+)\s*(.*)$/

function parseDate(dateString: string): { date: Date | null; isValid: boolean } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return { date: null, isValid: false }
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { date: null, isValid: false }
  }

  return { date, isValid: true }
}

export function parseTodoLine(line: string): TodoItem | null {
  const match = line.match(TODO_PATTERN)
  if (!match) {
    return null
  }

  const [, bracketContent, dueDateString, description] = match
  const isDone = bracketContent.trim().length > 0
  const { date, isValid } = parseDate(dueDateString)

  return {
    dueDate: date,
    dueDateString,
    description: description.trim(),
    isDone,
    isValid
  }
}

export function extractTodos(content: string): TodoItem[] {
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalizedContent.split('\n')
  const todos: TodoItem[] = []

  for (const line of lines) {
    const todo = parseTodoLine(line)
    if (todo) {
      todos.push(todo)
    }
  }

  return todos
}

function getDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isWithinDateRange(todo: TodoItem, maxDate: Date): boolean {
  if (!todo.isValid || !todo.dueDate) {
    return true
  }

  const dueDate = getDateOnly(todo.dueDate)
  return dueDate <= maxDate
}

export function getNotesWithTodos(notes: Note[]): NoteWithTodos[] {
  const today = getDateOnly(new Date())
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 7)

  const notesWithTodos: NoteWithTodos[] = []

  for (const note of notes) {
    const allTodos = extractTodos(note.content)
    const pendingTodos = allTodos.filter(todo => !todo.isDone)
    const todosInRange = pendingTodos.filter(todo => isWithinDateRange(todo, maxDate))

    if (todosInRange.length === 0) {
      continue
    }

    todosInRange.sort((a, b) => {
      if (!a.isValid && !b.isValid) return 0
      if (!a.isValid) return -1
      if (!b.isValid) return 1
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return -1
      if (!b.dueDate) return 1
      return a.dueDate.getTime() - b.dueDate.getTime()
    })

    let earliestDueDate: Date | null = null
    for (const todo of todosInRange) {
      if (todo.isValid && todo.dueDate) {
        earliestDueDate = todo.dueDate
        break
      }
    }

    notesWithTodos.push({
      note,
      todos: todosInRange,
      earliestDueDate
    })
  }

  notesWithTodos.sort((a, b) => {
    if (!a.earliestDueDate && !b.earliestDueDate) return 0
    if (!a.earliestDueDate) return -1
    if (!b.earliestDueDate) return 1
    return a.earliestDueDate.getTime() - b.earliestDueDate.getTime()
  })

  return notesWithTodos
}

export type TodoDateStatus = 'overdue' | 'today' | 'upcoming'

export function getTodoDateStatus(todo: TodoItem): TodoDateStatus {
  if (!todo.isValid || !todo.dueDate) {
    return 'overdue'
  }

  const today = getDateOnly(new Date())
  const dueDate = getDateOnly(todo.dueDate)

  if (dueDate < today) {
    return 'overdue'
  } else if (dueDate.getTime() === today.getTime()) {
    return 'today'
  } else {
    return 'upcoming'
  }
}
