# General Info

This is a single-user, git-backed note-taking web application with full-text search,
MFA, and mobile-friendly design.

## Architecture
- Web app built with Hono (lightweight web framework)
- Server-side rendering with Hono JSX
- Layered architecture: routes → services → data access
- Centralized configuration with validation on startup
- Runs on VPS as Dokku app
- Ephemeral storage at /app/notes (rebuilt from GitHub on deploy)
- Encrypted GitHub remote using git-remote-gcrypt
- End-to-end encryption with GPG keys
- 30-second cache with invalidation on changes
- Queue-based git operations to prevent conflicts
- Structured error logging with contextual information

## Features
- Full-text fuzzy search with Fuse.js
- Tag-based search (colon-separated: :tag1:tag2:tag3:)
- Note pinning via :pinned: tag
- TODO tracking with due dates and color-coded status
- Automatic git commit and push on create/update
- Manual upstream sync with /sync endpoint
- Username/password authentication with bcrypt
- TOTP-based MFA (optional)
- Session management with 7-day expiration
- Mobile-friendly responsive design
- Simple textarea editor
- Markdown rendering with GFM support

## Data Model
- Each file is a separate note in Markdown format
- Filenames: YYYY-MM-DD_HH:MM:SS.md (auto-timestamped)
- New notes created in notes/new/ subdirectory
- Hidden folders (e.g., .git) are ignored when reading notes
- Most notes end with colon-separated tags on last line
- First header (H1-H6) used as note title
- TODOs: `- TODO[] YYYY-MM-DD description` (see TODO Tracking section)
- Less than 1000 files total
- Total size: few MB

# Technology Stack

## Core Dependencies
- **hono** (v4.11.3) - Web framework with JSX support
- **@hono/node-server** (v1.19.7) - Node.js adapter
- **simple-git** (v3.30.0) - Git operations
- **fuse.js** (v7.1.0) - Fuzzy search
- **marked** (v17.0.1) - Markdown parsing
- **bcrypt** (v6.0.0) - Password hashing
- **otplib** (v12.0.1) - TOTP MFA
- **qrcode** (v1.5.4) - QR code generation

## Dev Dependencies
- **vitest** (v4.0.16) - Test framework

## Runtime
- Node.js 24.12.0
- npm 11.7.0
- TypeScript 5.9.3

# Project Structure

```
/home/user/notes-app/
├── src/
│   ├── index.tsx              Main server entry point (slim, ~40 lines)
│   ├── config/
│   │   └── index.ts           Configuration constants & validation
│   ├── routes/
│   │   ├── auth.tsx           Login/logout route handlers
│   │   ├── notes.tsx          Note CRUD route handlers
│   │   └── home.tsx           Home page & sync route handlers
│   ├── services/
│   │   └── homePageService.ts Business logic for home page data
│   ├── types/
│   │   └── index.ts           Shared TypeScript types
│   ├── auth.ts                Authentication middleware
│   ├── session.ts             Session management
│   ├── notes.ts               Note operations & caching
│   ├── git.ts                 Git operations & queue (no setup logic)
│   ├── search.ts              Fuzzy search with Fuse.js
│   ├── markdown.ts            Markdown parsing utilities
│   ├── todos.ts               TODO parsing & filtering
│   ├── todos.test.ts          Unit tests for TODO parsing
│   ├── logger.ts              Structured error logging utility
│   ├── components/
│   │   ├── Layout.tsx         HTML layout wrapper
│   │   ├── Header.tsx         Page header with auth info
│   │   ├── NoteCard.tsx       Note list item component
│   │   └── TodoCard.tsx       TODO list item component
│   └── views/
│       ├── LoginPage.tsx      Login form with MFA
│       ├── HomePage.tsx       Dashboard with search
│       ├── NoteDetailPage.tsx View rendered note
│       ├── EditNotePage.tsx   Edit note textarea
│       ├── NewNotePage.tsx    Create note form
│       └── ErrorPage.tsx      Error display page (404, 500)
├── public/
│   ├── styles.css             Responsive UI styling
│   └── favicon.svg
├── scripts/
│   ├── hash-password.ts       Password hashing utility
│   ├── setup-mfa.ts           MFA setup with QR code
│   └── predeploy.sh           Dokku predeploy script (git clone)
├── Dockerfile                 Container image definition
├── package.json
├── tsconfig.json
├── app.json                   Dokku deployment config
├── Procfile                   Process definition
└── .env.example               Environment template
```

# Environment Variables

Required:
- **USERNAME** - Login username
- **PASSWORD_HASH** - Bcrypt hash (use scripts/hash-password.ts)
- **GPG_KEY_ID** - GPG key ID for git-remote-gcrypt encryption
- **GITHUB_REPO_URL** - GitHub repository URL (SSH or HTTPS)
- **GPG_PRIVATE_KEY** - Base64-encoded GPG private key

Optional:
- **TOTP_SECRET** - Base32 MFA secret (use scripts/setup-mfa.ts)
- **NOTES_DIR** - Note storage path (default: /app/notes)
- **SKIP_AUTH** - Set to "true" for local development bypass
- **PORT** - Server port (default: 3000)
- **NODE_ENV** - development or production

# Development

## Setup
```bash
npm install
npm run build
```

## Run locally
```bash
SKIP_AUTH=true npm run dev
```

## Create password hash
```bash
npx tsx scripts/hash-password.ts
```

## Setup MFA (optional)
```bash
npx tsx scripts/setup-mfa.ts
```

## Run tests
```bash
npm test
```

## Build for production
```bash
npm run build
npm start
```

# Deployment

## Dokku Configuration
- **Process**: Single web process defined in Procfile
- **Build**: Docker-based build with Dockerfile
- **Container**: Node.js 24 slim with git-remote-gcrypt installed
- **Predeploy**: scripts/predeploy.sh clones repo and sets up credentials (committed to image)
- **Start**: npm start (node dist/index.js)
- **Health Check**: GET /health (3 attempts, 5s timeout, 5s wait)
- **Storage**: Ephemeral (no mounted volumes)

## Git Integration
- **Encryption**: git-remote-gcrypt with GPG keys
- **Remote**: Encrypted GitHub repository (SSH or HTTPS)
- **Storage**: Ephemeral /app/notes (cloned during predeploy, committed to image)
- **Predeploy Script**: Handles GPG key import, SSH key install, repo clone, git user config
- **Credentials**: SSH/GPG keys committed to image during predeploy
- **App Startup**: Verifies repo exists (fail-fast if missing)
- **Operations**: Pull-before-push strategy prevents conflicts
- **Queue**: Queue-based operations prevent race conditions
- **Commits**: Git user is notes@app.local (Notes App)
- **Security**: GitHub sees only encrypted data (content + commit messages)
- **Access**: Decrypt with GPG private key on laptop or VPS

# Configuration

All configuration constants are centralized in `src/config/index.ts`:

## Application Constants
- `SESSION_MAX_AGE_SECONDS`: 7 days session duration
- `SESSION_CLEANUP_INTERVAL_MS`: 1 hour cleanup interval
- `SESSION_ID_BYTES`: 32 bytes for session IDs
- `SEARCH_RESULTS_LIMIT`: 5 search results per query
- `LAST_MODIFIED_NOTES_COUNT`: 3 notes on home page
- `CACHE_TTL_MS`: 30 seconds cache time-to-live
- `TODO_DAYS_AHEAD`: 7 days ahead for TODO filtering
- `NEW_NOTES_SUBDIR`: 'new' subdirectory for new notes
- `GIT_USER_EMAIL`: 'notes@app.local' for git commits
- `GIT_USER_NAME`: 'Notes App' for git commits

## Validation on Startup
- Validates `PASSWORD_HASH` is set (when auth enabled)
- Validates `TOTP_SECRET` is set (when auth enabled)
- Validates `PORT` is a valid port number (1-65535)
- Validates `GPG_KEY_ID` is set
- Validates `GITHUB_REPO_URL` is set
- Validates `GPG_PRIVATE_KEY` is set
- Exits with clear error messages if validation fails
- Provides instructions for fixing configuration errors

# Error Handling

## Structured Logging
- All errors logged with timestamps and context
- Format: `[timestamp] ERROR in contextName: message`
- Includes details (userId, filename, query, etc.)
- Stack traces captured for debugging

## User-Facing Errors
- 404 errors show ErrorPage with "Note Not Found" message
- 500 errors show ErrorPage with "Error Loading Page" message
- Error pages include "Go Home" button for easy navigation
- Git operation failures logged but don't crash the app
- Sync failures display error message on home page

# Code Style

- Never use comments
- Limit line length to 100 characters
- Use TypeScript strict mode
- Server-side JSX components for UI
- Functional programming style preferred
- Layered architecture: routes handle HTTP, services handle business logic
- Centralized configuration in config/index.ts

# Workflow

- Always use latest dependency versions when adding new packages
- Test locally with SKIP_AUTH=true before deployment
- Commit message format: "Create <filename>" or "Update <filename>"
- Use npm run build to verify TypeScript compilation

# Security

- Bcrypt password hashing (10 rounds)
- TOTP-based MFA (RFC 6238 compliant)
- HTTP-only, secure cookies in production
- SameSite=Lax cookie policy
- 7-day session expiration
- Constant-time password comparison
- Hourly cleanup of expired sessions

# Search Implementation

## Weighted Fields
- Tags: weight 3 (highest priority)
- First header: weight 2
- Filename: weight 1.5
- Content: weight 1

## Configuration
- Fuse.js threshold: 0.2 (80% match required)
- Minimum search length: 2 characters
- Result limit: 5 notes
- Case-insensitive matching

# TODO Tracking

## Format
```
- TODO[] YYYY-MM-DD description
- TODO[ ] YYYY-MM-DD description (space in brackets = not done)
- TODO[x] YYYY-MM-DD description (any non-whitespace = done)
```

## Rules
- TODOs can be indented (nested lists supported)
- Flexible whitespace between components
- Supports both LF and CRLF line endings
- Invalid dates are shown in red (treated as overdue)

## Display
- TODO section appears on home page (above Pinned Notes)
- Only shows pending TODOs (done TODOs are hidden)
- Date range: all overdue + today + next 7 days
- Section hidden if no TODOs in range

## Date Colors
- **Red**: overdue or invalid date
- **Blue**: due today
- **Green**: due within next 7 days

## Sorting
- Notes sorted by most urgent TODO
- Within a note, TODOs sorted by due date
- Invalid dates sort before valid dates
