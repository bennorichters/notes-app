export function logError(context: string, error: unknown, details?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  console.error(`[${timestamp}] ERROR in ${context}:`, errorMessage)

  if (details) {
    console.error('Details:', details)
  }

  if (errorStack) {
    console.error('Stack:', errorStack)
  }
}

export function logWarning(context: string, message: string, details?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  console.warn(`[${timestamp}] WARNING in ${context}:`, message)

  if (details) {
    console.warn('Details:', details)
  }
}
