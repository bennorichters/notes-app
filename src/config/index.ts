export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
export const SEARCH_RESULTS_LIMIT = 5

export const USERNAME = process.env.USERNAME || 'admin'
export const PASSWORD_HASH = process.env.PASSWORD_HASH || ''
export const TOTP_SECRET = process.env.TOTP_SECRET || ''
export const SKIP_AUTH = process.env.SKIP_AUTH === 'true'
export const PORT = parseInt(process.env.PORT || '3000')
