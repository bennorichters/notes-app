export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
export const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000
export const SESSION_ID_BYTES = 32
export const SEARCH_RESULTS_LIMIT = 5
export const LAST_MODIFIED_NOTES_COUNT = 3
export const CACHE_TTL_MS = 30 * 1000
export const TODO_DAYS_AHEAD = 7
export const NEW_NOTES_SUBDIR = 'new'
export const GIT_USER_EMAIL = 'notes@app.local'
export const GIT_USER_NAME = 'Notes App'

export const USERNAME = process.env.USERNAME || 'admin'
export const PASSWORD_HASH = process.env.PASSWORD_HASH || ''
export const TOTP_SECRET = process.env.TOTP_SECRET || ''
export const SKIP_AUTH = process.env.SKIP_AUTH === 'true'
export const PORT = parseInt(process.env.PORT || '3000')
export const NOTES_DIR = process.env.NOTES_DIR || './notes'

export function validateConfig(): void {
  const errors: string[] = []

  if (!SKIP_AUTH) {
    if (!PASSWORD_HASH) {
      errors.push('PASSWORD_HASH environment variable is required when authentication is enabled')
      errors.push('Generate one using: npx tsx scripts/hash-password.ts')
    }

    if (!TOTP_SECRET) {
      errors.push('TOTP_SECRET environment variable is required when authentication is enabled')
      errors.push('Generate one using: npx tsx scripts/setup-mfa.ts')
    }
  }

  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    errors.push(`PORT must be a valid port number (1-65535), got: ${process.env.PORT}`)
  }

  if (errors.length > 0) {
    console.error('\n❌ Configuration validation failed:\n')
    errors.forEach(error => console.error(`  - ${error}`))
    console.error('\nPlease fix the configuration errors and restart the application.\n')
    process.exit(1)
  }
}
