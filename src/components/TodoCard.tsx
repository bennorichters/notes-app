import type { FC } from 'hono/jsx'
import { getTodoDateStatus, type TodoItem, type TodoDateStatus } from '../todos.js'

type TodoCardProps = {
  noteFilename: string
  noteTitle: string
  todos: TodoItem[]
}

function formatDate(todo: TodoItem): string {
  if (!todo.isValid) {
    return todo.dueDateString
  }
  return todo.dueDateString
}

function getDateClass(status: TodoDateStatus): string {
  switch (status) {
    case 'overdue':
      return 'todo-date todo-date-overdue'
    case 'today':
      return 'todo-date todo-date-today'
    case 'upcoming':
      return 'todo-date todo-date-upcoming'
  }
}

export const TodoCard: FC<TodoCardProps> = ({ noteFilename, noteTitle, todos }) => {
  return (
    <a href={`/note/${noteFilename}`} class="note-link">
      <div class="note-card todo-card">
        <div class="note-title">
          {noteTitle}
        </div>
        <div class="todo-list">
          {todos.map(todo => {
            const status = getTodoDateStatus(todo)
            return (
              <div class="todo-item">
                <span class={getDateClass(status)}>{formatDate(todo)}</span>
                <span class="todo-description">{todo.description}</span>
              </div>
            )
          })}
        </div>
      </div>
    </a>
  )
}
