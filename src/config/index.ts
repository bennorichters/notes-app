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
export const NOTES_DIR = process.env.NOTES_DIR || '/app/notes'
export const GPG_KEY_ID = process.env.GPG_KEY_ID || ''
export const GITHUB_REPO_URL = process.env.GITHUB_REPO_URL || ''
export const GPG_PRIVATE_KEY = process.env.GPG_PRIVATE_KEY || ''

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

  if (!GPG_KEY_ID) {
    errors.push('GPG_KEY_ID environment variable is required')
    errors.push('Set the GPG key ID used for git-remote-gcrypt encryption')
  }

  if (!GITHUB_REPO_URL) {
    errors.push('GITHUB_REPO_URL environment variable is required')
    errors.push('Set the GitHub repository URL (e.g., git@github.com:user/repo.git)')
  }

  if (!GPG_PRIVATE_KEY) {
    errors.push('GPG_PRIVATE_KEY environment variable is required')
    errors.push('Export your GPG private key as base64 and set it in this variable')
  }

  if (errors.length > 0) {
    console.error('\n❌ Configuration validation failed:\n')
    errors.forEach(error => console.error(`  - ${error}`))
    console.error('\nPlease fix the configuration errors and restart the application.\n')
    process.exit(1)
  }
}
