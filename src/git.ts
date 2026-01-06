import { simpleGit, type SimpleGit } from 'simple-git'

const NOTES_DIR = process.env.NOTES_DIR || './notes'

export function getGit(): SimpleGit {
  return simpleGit(NOTES_DIR, {
    config: [`safe.directory=${NOTES_DIR}`]
  })
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
