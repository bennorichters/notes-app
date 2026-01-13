import { simpleGit, type SimpleGit } from 'simple-git'
import { execSync } from 'child_process'
import { access, constants, mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import {
  NOTES_DIR,
  GIT_USER_EMAIL,
  GIT_USER_NAME,
  GPG_KEY_ID,
  GITHUB_REPO_URL,
  GPG_PRIVATE_KEY
} from './config/index.js'
import { logError } from './logger.js'

export function getGit(): SimpleGit {
  return simpleGit(NOTES_DIR)
}

async function isGitRepo(path: string): Promise<boolean> {
  try {
    await access(join(path, '.git'), constants.R_OK)
    return true
  } catch {
    return false
  }
}

export async function importGPGKey(): Promise<void> {
  try {
    execSync(`gpg --list-secret-keys ${GPG_KEY_ID}`, { stdio: 'pipe' })
    console.log('GPG key already exists in keyring, skipping import')
    return
  } catch {
  }

  console.log('Importing GPG private key...')
  try {
    const keyData = Buffer.from(GPG_PRIVATE_KEY, 'base64').toString('utf-8')
    const tempKeyFile = '/tmp/gpg-import-key.asc'
    await writeFile(tempKeyFile, keyData)
    execSync(`gpg --batch --import ${tempKeyFile}`, { stdio: 'pipe' })
    execSync(`rm ${tempKeyFile}`)
    execSync(`echo "${GPG_KEY_ID}:6:" | gpg --import-ownertrust`, { stdio: 'pipe' })
    console.log('GPG key imported successfully')
  } catch (error) {
    console.error('Failed to import GPG key:', error)
    throw error
  }
}

export function initGitConfig(): void {
  execSync(`git -C "${NOTES_DIR}" config user.email "${GIT_USER_EMAIL}"`)
  execSync(`git -C "${NOTES_DIR}" config user.name "${GIT_USER_NAME}"`)
}

export async function initGitRepository(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    execSync(`git config --global --add safe.directory "${NOTES_DIR}"`)
  }

  await mkdir(NOTES_DIR, { recursive: true })

  const localExists = await isGitRepo(NOTES_DIR)

  if (localExists) {
    console.log(`Local repository exists at ${NOTES_DIR}, pulling latest changes...`)
    const git = getGit()
    try {
      await git.pull('origin', 'main')
      console.log('Pull completed successfully')
    } catch (error) {
      console.log('Pull failed (possibly first run or no remote), continuing...')
    }
  } else {
    console.log(`Cloning from encrypted GitHub repository...`)
    const gcryptUrl = `gcrypt::${GITHUB_REPO_URL}`
    try {
      await simpleGit().clone(gcryptUrl, NOTES_DIR)
      console.log('Clone completed successfully')
      initGitConfig()
    } catch (error) {
      console.log('Clone failed (possibly empty repo), initializing new repository...')
      const git = simpleGit(NOTES_DIR)
      await git.init()
      await git.checkoutLocalBranch('main')
      initGitConfig()
    }
  }

  const git = getGit()
  try {
    const remotes = await git.getRemotes()
    if (!remotes.find(r => r.name === 'origin')) {
      const gcryptUrl = `gcrypt::${GITHUB_REPO_URL}`
      await git.addRemote('origin', gcryptUrl)
    }
  } catch {
    const gcryptUrl = `gcrypt::${GITHUB_REPO_URL}`
    await git.addRemote('origin', gcryptUrl)
  }

  execSync(`git -C "${NOTES_DIR}" config remote.origin.gcrypt-participants "${GPG_KEY_ID}"`)
  console.log('Git repository initialized with encrypted remote')
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
  try {
    await git.pull('origin', 'main')
  } catch {
  }
  await git.add(relativePath)
  await git.commit(commitMessage)
  await git.push('origin', 'main')
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
  await git.pull('origin', 'main')
}
