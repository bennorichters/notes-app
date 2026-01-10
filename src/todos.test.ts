import { describe, it, expect } from 'vitest'
import { parseTodoLine } from './todos.js'

describe('parseTodoLine', () => {
  it('parses a basic TODO line', () => {
    const result = parseTodoLine('- TODO[] 2026-01-10 Start cooking this')
    expect(result).not.toBeNull()
    expect(result!.dueDateString).toBe('2026-01-10')
    expect(result!.description).toBe('Start cooking this')
    expect(result!.isDone).toBe(false)
    expect(result!.isValid).toBe(true)
  })

  it('parses a done TODO', () => {
    const result = parseTodoLine('- TODO[x] 2026-01-10 Completed task')
    expect(result).not.toBeNull()
    expect(result!.isDone).toBe(true)
    expect(result!.description).toBe('Completed task')
  })

  it('parses a TODO with any non-whitespace in brackets as done', () => {
    const result = parseTodoLine('- TODO[done] 2026-01-10 Another done task')
    expect(result).not.toBeNull()
    expect(result!.isDone).toBe(true)
  })

  it('parses a TODO with only whitespace in brackets as not done', () => {
    const result = parseTodoLine('- TODO[   ] 2026-01-10 Still pending')
    expect(result).not.toBeNull()
    expect(result!.isDone).toBe(false)
  })

  it('parses a TODO with single space in brackets as not done', () => {
    const result = parseTodoLine('- TODO[ ] 2026-01-13 Fix the code')
    expect(result).not.toBeNull()
    expect(result!.isDone).toBe(false)
    expect(result!.dueDateString).toBe('2026-01-13')
    expect(result!.description).toBe('Fix the code')
  })

  it('parses an indented TODO', () => {
    const result = parseTodoLine('  - TODO[] 2026-01-10 Indented task')
    expect(result).not.toBeNull()
    expect(result!.description).toBe('Indented task')
  })

  it('parses a tab-indented TODO', () => {
    const result = parseTodoLine('\t- TODO[] 2026-01-10 Tab indented')
    expect(result).not.toBeNull()
    expect(result!.description).toBe('Tab indented')
  })

  it('handles flexible whitespace after brackets', () => {
    const result = parseTodoLine('- TODO[]  2026-01-10 Double space')
    expect(result).not.toBeNull()
    expect(result!.dueDateString).toBe('2026-01-10')
  })

  it('handles flexible whitespace after dash', () => {
    const result = parseTodoLine('-  TODO[] 2026-01-10 Double space after dash')
    expect(result).not.toBeNull()
    expect(result!.dueDateString).toBe('2026-01-10')
  })

  it('marks invalid date format as invalid', () => {
    const result = parseTodoLine('- TODO[] invalid-date Some task')
    expect(result).not.toBeNull()
    expect(result!.isValid).toBe(false)
    expect(result!.dueDate).toBeNull()
    expect(result!.dueDateString).toBe('invalid-date')
  })

  it('marks nonsensical date as invalid', () => {
    const result = parseTodoLine('- TODO[] 2026-13-45 Bad date')
    expect(result).not.toBeNull()
    expect(result!.isValid).toBe(false)
    expect(result!.dueDate).toBeNull()
  })

  it('returns null for non-TODO lines', () => {
    expect(parseTodoLine('Just a regular line')).toBeNull()
    expect(parseTodoLine('- Regular list item')).toBeNull()
    expect(parseTodoLine('TODO without dash')).toBeNull()
  })

  it('returns null for malformed TODO lines', () => {
    expect(parseTodoLine('- TODO 2026-01-10 Missing brackets')).toBeNull()
    expect(parseTodoLine('- TODO[ 2026-01-10 Unclosed bracket')).toBeNull()
  })

  it('parses TODO with empty description', () => {
    const result = parseTodoLine('- TODO[] 2026-01-10')
    expect(result).not.toBeNull()
    expect(result!.description).toBe('')
  })

  it('creates correct Date object for valid dates', () => {
    const result = parseTodoLine('- TODO[] 2026-01-15 Test date')
    expect(result).not.toBeNull()
    expect(result!.dueDate).not.toBeNull()
    expect(result!.dueDate!.getFullYear()).toBe(2026)
    expect(result!.dueDate!.getMonth()).toBe(0)
    expect(result!.dueDate!.getDate()).toBe(15)
  })
})
