import { simpleGit, type SimpleGit } from 'simple-git'
import { execSync } from 'child_process'
import { access, constants, writeFile, unlink, stat } from 'fs/promises'
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

async function checkUpstreamWritable(bareRepoPath: string): Promise<boolean> {
  const testFile = join(bareRepoPath, '.write-test')
  try {
    await writeFile(testFile, 'test')
    await unlink(testFile)
    return true
  } catch (error) {
    return false
  }
}

async function getPathOwnership(path: string): Promise<{ uid: number; gid: number } | null> {
  try {
    const stats = await stat(path)
    return { uid: stats.uid, gid: stats.gid }
  } catch {
    return null
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

  const isWritable = await checkUpstreamWritable(NOTES_UPSTREAM)
  if (!isWritable) {
    const ownership = await getPathOwnership(NOTES_UPSTREAM)
    const currentUid = process.getuid ? process.getuid() : 'unknown'
    console.error('\n❌ WARNING: Upstream repository is not writable')
    console.error(`   Path: ${NOTES_UPSTREAM}`)
    console.error(`   Current process UID: ${currentUid}`)
    if (ownership) {
      console.error(`   Directory owner UID: ${ownership.uid} (GID: ${ownership.gid})`)
    }
    console.error('\n   This will prevent git push operations from succeeding.')
    console.error('   To fix this issue, ensure the upstream repository is owned by the app user:')
    console.error(`   chown -R ${currentUid}:${currentUid} ${NOTES_UPSTREAM}`)
    console.error('')
    logWarning('initGitRepository', 'Upstream repository is not writable', {
      path: NOTES_UPSTREAM,
      currentUid,
      ownership
    })
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
        const errorMessage = error instanceof Error ? error.message : String(error)
        const isPermissionError = errorMessage.includes('Permission denied') ||
                                   errorMessage.includes('unable to write') ||
                                   errorMessage.includes('unable to migrate objects')

        if (isPermissionError && NOTES_UPSTREAM) {
          console.error('\n❌ Git push failed due to permission error')
          console.error('   This usually means the upstream repository is not writable.')
          console.error(`   Please check ownership of: ${NOTES_UPSTREAM}`)
          console.error('   Expected owner UID: ' + (process.getuid ? process.getuid() : 'unknown'))
          console.error('')
        }

        logError('gitQueue', error, {
          notesDir: NOTES_DIR,
          notesUpstream: NOTES_UPSTREAM,
          isPermissionError
        })
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
