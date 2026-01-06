import Fuse from 'fuse.js'
import type { Note } from './notes.js'

const SEARCH_RESULTS_LIMIT = 5

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

export function searchNotes(
  notes: Note[],
  query: string,
  limit: number = SEARCH_RESULTS_LIMIT
): NoteSearchResult[] {
  if (!query || query.trim() === '') {
    return []
  }

  const fuse = new Fuse(notes, {
    keys: [
      { name: 'tags', weight: 3 },
      { name: 'firstHeader', weight: 2 },
      { name: 'filename', weight: 1.5 },
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
