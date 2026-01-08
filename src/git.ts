import { simpleGit, type SimpleGit } from 'simple-git'
import { access, constants } from 'fs/promises'
import { join } from 'path'

const NOTES_DIR = process.env.NOTES_DIR || './notes'
const NOTES_UPSTREAM = process.env.NOTES_UPSTREAM || ''

export function getGit(): SimpleGit {
  return simpleGit(NOTES_DIR, {
    config: [
      `safe.directory=${NOTES_DIR}`,
      `safe.directory=${NOTES_UPSTREAM}`
    ]
  })
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
    const git = simpleGit(path, { config: [`safe.directory=${path}`] })
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

export async function initGitRepository(): Promise<void> {
  if (!NOTES_UPSTREAM) {
    throw new Error('NOTES_UPSTREAM environment variable is not set')
  }

  const upstreamExists = await isDirectory(NOTES_UPSTREAM)
  if (!upstreamExists) {
    throw new Error(`Upstream bare repository does not exist: ${NOTES_UPSTREAM}`)
  }

  const upstreamIsBare = await isBareRepo(NOTES_UPSTREAM)
  if (!upstreamIsBare) {
    throw new Error(`Upstream is not a bare repository: ${NOTES_UPSTREAM}`)
  }

  const localExists = await isGitRepo(NOTES_DIR)

  if (localExists) {
    console.log(`Local repository exists at ${NOTES_DIR}, pulling latest changes...`)
    const git = getGit()
    await git.pull()
    console.log('Pull completed successfully')
  } else {
    console.log(`Cloning from ${NOTES_UPSTREAM} to ${NOTES_DIR}...`)
    const git = simpleGit({ config: [`safe.directory=${NOTES_UPSTREAM}`] })
    await git.clone(NOTES_UPSTREAM, NOTES_DIR)
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
        console.error(`Git operation failed in queue from ${NOTES_DIR}:`, error)
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
