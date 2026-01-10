import { simpleGit, type SimpleGit } from 'simple-git'
import { execSync } from 'child_process'
import { access, constants } from 'fs/promises'
import { join } from 'path'
import { NOTES_DIR, GIT_USER_EMAIL, GIT_USER_NAME } from './config/index.js'
import { logError, logWarning } from './logger.js'

const NOTES_UPSTREAM = process.env.NOTES_UPSTREAM || ''

export function getGit(): SimpleGit {
  return simpleGit(NOTES_DIR)
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK)
    return true
  } catch {
    return false
  }
}

async function isBareRepo(path: string): Promise<boolean> {
  try {
    const git = simpleGit(path)
    const result = await git.raw(['rev-parse', '--is-bare-repository'])
    return result.trim() === 'true'
  } catch {
    return false
  }
}

async function isGitRepo(path: string): Promise<boolean> {
  try {
    await access(join(path, '.git'), constants.R_OK)
    return true
  } catch {
    return false
  }
}

async function getDefaultBranch(bareRepoPath: string): Promise<string> {
  try {
    const git = simpleGit(bareRepoPath)
    const result = await git.raw(['branch'])
    const branches = result
      .split('\n')
      .map(b => b.replace('*', '').trim())
      .filter(b => b.length > 0)
    if (branches.includes('main')) return 'main'
    if (branches.includes('master')) return 'master'
    return branches[0] || 'main'
  } catch {
    return 'main'
  }
}

export function initGitConfig(): void {
  execSync(`git -C "${NOTES_DIR}" config user.email "${GIT_USER_EMAIL}"`)
  execSync(`git -C "${NOTES_DIR}" config user.name "${GIT_USER_NAME}"`)
}

export async function initGitRepository(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    execSync(`git config --global --add safe.directory "${NOTES_DIR}"`)
    if (NOTES_UPSTREAM) {
      execSync(`git config --global --add safe.directory "${NOTES_UPSTREAM}"`)
    }
  }

  const localExists = await isGitRepo(NOTES_DIR)

  if (!NOTES_UPSTREAM) {
    if (localExists) {
      console.log(`Local repository exists at ${NOTES_DIR}, using it without upstream`)
    } else {
      console.log(`Initializing new git repository at ${NOTES_DIR}`)
      const git = simpleGit(NOTES_DIR)
      await git.init()
      initGitConfig()
      console.log('Git repository initialized successfully')
    }
    return
  }

  const upstreamExists = await isDirectory(NOTES_UPSTREAM)
  if (!upstreamExists) {
    throw new Error(`Upstream bare repository does not exist: ${NOTES_UPSTREAM}`)
  }

  const upstreamIsBare = await isBareRepo(NOTES_UPSTREAM)
  if (!upstreamIsBare) {
    throw new Error(`Upstream is not a bare repository: ${NOTES_UPSTREAM}`)
  }

  if (localExists) {
    console.log(`Local repository exists at ${NOTES_DIR}, pulling latest changes...`)
    const git = getGit()
    await git.pull()
    console.log('Pull completed successfully')
  } else {
    const branch = await getDefaultBranch(NOTES_UPSTREAM)
    console.log(`Cloning from ${NOTES_UPSTREAM} to ${NOTES_DIR} (branch: ${branch})...`)
    await simpleGit().clone(NOTES_UPSTREAM, NOTES_DIR, ['--branch', branch])
    initGitConfig()
    console.log('Clone completed successfully')
  }
}

const gitQueue: Array<() => Promise<void>> = []
let isProcessingQueue = false

async function processGitQueue() {
  if (isProcessingQueue || gitQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  while (gitQueue.length > 0) {
    const operation = gitQueue.shift()
    if (operation) {
      try {
        await operation()
      } catch (error) {
        logError('gitQueue', error, { notesDir: NOTES_DIR })
      }
    }
  }

  isProcessingQueue = false
}

export function queueGitOperation(operation: () => Promise<void>): void {
  gitQueue.push(operation)
  processGitQueue()
}

export async function commitAndPush(
  relativePath: string,
  commitMessage: string
): Promise<void> {
  const git = getGit()
  await git.pull()
  await git.add(relativePath)
  await git.commit(commitMessage)
  await git.push()
}

export function queueCommitAndPush(
  relativePath: string,
  commitMessage: string
): void {
  queueGitOperation(async () => {
    await commitAndPush(relativePath, commitMessage)
  })
}

export async function pullFromUpstream(): Promise<void> {
  const git = getGit()
  await git.pull()
}
