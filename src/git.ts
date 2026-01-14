import { simpleGit, type SimpleGit } from 'simple-git'
import { NOTES_DIR, GITHUB_REPO_URL } from './config/index.js'
import { logError } from './logger.js'

export function getGit(): SimpleGit {
  return simpleGit(NOTES_DIR)
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
        logError('gitQueue', error, {
          notesDir: NOTES_DIR,
          githubRepoUrl: GITHUB_REPO_URL
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
  const status = await git.status()
  const currentBranch = status.current || 'master'
  console.log(`Git: Committing and pushing ${relativePath}...`)
  try {
    await git.pull('origin', currentBranch)
    console.log('Git: Pulled latest changes from origin')
  } catch (error) {
    console.log('Git: Pull skipped (no remote changes)')
  }
  await git.add(relativePath)
  console.log(`Git: add "${relativePath}"`)
  await git.commit(commitMessage)
  console.log(`Git: Committed "${commitMessage}"`)
  await git.push('origin', currentBranch)
  console.log(`Git: Pushed to origin/${currentBranch}`)
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
  const status = await git.status()
  const currentBranch = status.current || 'master'
  console.log(`Git: Synchronizing from origin/${currentBranch}...`)
  await git.pull('origin', currentBranch)
  console.log('Git: Synchronization complete')
}
