import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true
})

export function extractFirstHeader(content: string): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '')
    }
  }
  return ''
}

export function extractTags(content: string): string[] {
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
