// GitHub API wrapper using Octokit
import { Octokit } from '@octokit/rest'
import { Post, PostFolder, getFolder } from './posts'

// Configuration - users will set these in settings
export interface GitHubConfig {
  owner: string
  repo: string
  branch?: string
}

const POSTS_BASE_PATH = 'posts'

// Create Octokit instance
function getOctokit(token: string): Octokit {
  return new Octokit({ auth: token })
}

// Get the file path for a post
function getPostPath(folder: PostFolder, id: string): string {
  return `${POSTS_BASE_PATH}/${folder}/${id}.json`
}

// List all posts in a folder
export async function listPosts(
  token: string,
  config: GitHubConfig,
  folder: PostFolder
): Promise<Post[]> {
  const octokit = getOctokit(token)
  const path = `${POSTS_BASE_PATH}/${folder}`

  try {
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
      ref: config.branch,
    })

    if (!Array.isArray(data)) {
      return []
    }

    // Filter for JSON files only
    const jsonFiles = data.filter(
      (file) => file.type === 'file' && file.name.endsWith('.json')
    )

    // Fetch each post content
    const posts = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const content = await getFileContent(token, config, file.path)
          return JSON.parse(content) as Post
        } catch {
          console.error(`Failed to parse post: ${file.path}`)
          return null
        }
      })
    )

    return posts.filter((post): post is Post => post !== null)
  } catch (error) {
    // Folder might not exist yet
    if ((error as { status?: number }).status === 404) {
      return []
    }
    throw error
  }
}

// Get a single post by ID
export async function getPost(
  token: string,
  config: GitHubConfig,
  id: string,
  folder?: PostFolder
): Promise<Post | null> {
  const folders: PostFolder[] = folder ? [folder] : ['drafts', 'scheduled', 'published']

  for (const f of folders) {
    try {
      const path = getPostPath(f, id)
      const content = await getFileContent(token, config, path)
      return JSON.parse(content) as Post
    } catch {
      continue
    }
  }

  return null
}

// Get file content as string
async function getFileContent(
  token: string,
  config: GitHubConfig,
  path: string
): Promise<string> {
  const octokit = getOctokit(token)

  const { data } = await octokit.repos.getContent({
    owner: config.owner,
    repo: config.repo,
    path,
    ref: config.branch,
  })

  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error('Path is not a file')
  }

  return Buffer.from(data.content, 'base64').toString('utf-8')
}

// Get file SHA (needed for updates)
async function getFileSha(
  token: string,
  config: GitHubConfig,
  path: string
): Promise<string | null> {
  const octokit = getOctokit(token)

  try {
    const { data } = await octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
      ref: config.branch,
    })

    if (Array.isArray(data) || data.type !== 'file') {
      return null
    }

    return data.sha
  } catch {
    return null
  }
}

// Save a post (create or update)
export async function savePost(
  token: string,
  config: GitHubConfig,
  post: Post
): Promise<void> {
  const octokit = getOctokit(token)
  const folder = getFolder(post.status)
  const path = getPostPath(folder, post.id)

  // Update the updatedAt timestamp
  post.updatedAt = new Date().toISOString()

  const content = JSON.stringify(post, null, 2)
  const encodedContent = Buffer.from(content).toString('base64')

  // Check if file exists to get SHA
  const sha = await getFileSha(token, config, path)

  await octokit.repos.createOrUpdateFileContents({
    owner: config.owner,
    repo: config.repo,
    path,
    message: sha ? `Update post: ${post.id}` : `Create post: ${post.id}`,
    content: encodedContent,
    branch: config.branch,
    ...(sha && { sha }),
  })
}

// Move a post between folders (when status changes)
export async function movePost(
  token: string,
  config: GitHubConfig,
  post: Post,
  fromFolder: PostFolder,
  toFolder: PostFolder
): Promise<void> {
  if (fromFolder === toFolder) {
    // Just update in place
    await savePost(token, config, post)
    return
  }

  const octokit = getOctokit(token)
  const fromPath = getPostPath(fromFolder, post.id)

  // Get the old file SHA for deletion
  const sha = await getFileSha(token, config, fromPath)
  if (!sha) {
    // File doesn't exist in old location, just create in new
    await savePost(token, config, post)
    return
  }

  // Create in new location
  await savePost(token, config, post)

  // Delete from old location
  await octokit.repos.deleteFile({
    owner: config.owner,
    repo: config.repo,
    path: fromPath,
    message: `Move post ${post.id}: ${fromFolder} -> ${toFolder}`,
    sha,
    branch: config.branch,
  })
}

// Delete a post
export async function deletePost(
  token: string,
  config: GitHubConfig,
  id: string,
  folder: PostFolder
): Promise<void> {
  const octokit = getOctokit(token)
  const path = getPostPath(folder, id)

  const sha = await getFileSha(token, config, path)
  if (!sha) {
    return // Already deleted
  }

  await octokit.repos.deleteFile({
    owner: config.owner,
    repo: config.repo,
    path,
    message: `Delete post: ${id}`,
    sha,
    branch: config.branch,
  })
}

// Initialize posts directory structure
export async function initializePostsDirectory(
  token: string,
  config: GitHubConfig
): Promise<void> {
  const octokit = getOctokit(token)
  const folders: PostFolder[] = ['drafts', 'scheduled', 'published']

  for (const folder of folders) {
    const path = `${POSTS_BASE_PATH}/${folder}/.gitkeep`

    try {
      await getFileSha(token, config, path)
      // File exists, skip
    } catch {
      // Create .gitkeep
      await octokit.repos.createOrUpdateFileContents({
        owner: config.owner,
        repo: config.repo,
        path,
        message: `Initialize ${folder} folder`,
        content: Buffer.from('').toString('base64'),
        branch: config.branch,
      })
    }
  }
}

// Verify repo access
export async function verifyRepoAccess(
  token: string,
  config: GitHubConfig
): Promise<boolean> {
  const octokit = getOctokit(token)

  try {
    await octokit.repos.get({
      owner: config.owner,
      repo: config.repo,
    })
    return true
  } catch {
    return false
  }
}
