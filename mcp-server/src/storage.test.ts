import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Set up test storage directory BEFORE importing storage module
const TEST_STORAGE_DIR = path.join(os.tmpdir(), `.social-scheduler-test-${Date.now()}`)
process.env.TEST_STORAGE_DIR = TEST_STORAGE_DIR

// Now import the storage module (it will use TEST_STORAGE_DIR)
const {
  createPost,
  getPost,
  updatePost,
  deletePost,
  listPosts,
  readPosts,
} = await import('./storage.js')

describe('MCP Server Storage', () => {
  beforeAll(() => {
    // Ensure test directory exists
    if (!fs.existsSync(TEST_STORAGE_DIR)) {
      fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true })
    }
  })

  beforeEach(() => {
    // Clear storage before each test
    const storagePath = path.join(TEST_STORAGE_DIR, 'posts.json')
    if (fs.existsSync(storagePath)) {
      fs.unlinkSync(storagePath)
    }
  })

  afterAll(() => {
    // Clean up test storage directory
    if (fs.existsSync(TEST_STORAGE_DIR)) {
      fs.rmSync(TEST_STORAGE_DIR, { recursive: true })
    }
  })

  describe('createPost', () => {
    it('should create a basic post', () => {
      const post = createPost({
        platforms: ['twitter'],
        content: {
          twitter: { text: 'Hello world!' },
        },
      })

      expect(post.id).toBeDefined()
      expect(post.platforms).toEqual(['twitter'])
      expect(post.content.twitter?.text).toBe('Hello world!')
      expect(post.status).toBe('draft')
      expect(post.createdAt).toBeDefined()
      expect(post.updatedAt).toBeDefined()
    })

    it('should create a post with notes', () => {
      const post = createPost({
        platforms: ['twitter'],
        content: {
          twitter: { text: 'Post with notes' },
        },
        notes: 'Remember to add hashtags #testing',
      })

      expect(post.notes).toBe('Remember to add hashtags #testing')
    })

    it('should create a post without notes (undefined)', () => {
      const post = createPost({
        platforms: ['twitter'],
        content: {
          twitter: { text: 'Post without notes' },
        },
      })

      expect(post.notes).toBeUndefined()
    })

    it('should create a Reddit post with multiple subreddits', () => {
      const post = createPost({
        platforms: ['reddit'],
        content: {
          reddit: {
            subreddits: ['startups', 'SaaS', 'sideproject'],
            title: 'Cross-posting test',
            body: 'Testing multiple subreddits',
          },
        },
      })

      expect(post.content.reddit?.subreddits).toEqual(['startups', 'SaaS', 'sideproject'])
      expect(post.content.reddit?.subreddits).toHaveLength(3)
    })

    it('should create a Reddit post with a single subreddit', () => {
      const post = createPost({
        platforms: ['reddit'],
        content: {
          reddit: {
            subreddits: ['webdev'],
            title: 'Single subreddit test',
          },
        },
      })

      expect(post.content.reddit?.subreddits).toEqual(['webdev'])
      expect(post.content.reddit?.subreddits).toHaveLength(1)
    })

    it('should create a multi-platform post with notes and subreddits', () => {
      const post = createPost({
        platforms: ['twitter', 'linkedin', 'reddit'],
        content: {
          twitter: { text: 'Big announcement!' },
          linkedin: { text: 'Professional update', visibility: 'public' },
          reddit: {
            subreddits: ['startups', 'entrepreneur'],
            title: 'Launch announcement',
            body: 'We are launching!',
          },
        },
        notes: 'Post at 9am for maximum engagement',
      })

      expect(post.platforms).toHaveLength(3)
      expect(post.notes).toBe('Post at 9am for maximum engagement')
      expect(post.content.reddit?.subreddits).toEqual(['startups', 'entrepreneur'])
    })

    it('should persist posts to storage', () => {
      createPost({
        platforms: ['twitter'],
        content: { twitter: { text: 'Test 1' } },
      })
      createPost({
        platforms: ['linkedin'],
        content: { linkedin: { text: 'Test 2', visibility: 'public' } },
      })

      const posts = readPosts()
      expect(posts).toHaveLength(2)
    })
  })

  describe('getPost', () => {
    it('should retrieve a post by ID', () => {
      const created = createPost({
        platforms: ['twitter'],
        content: { twitter: { text: 'Find me' } },
        notes: 'Test notes',
      })

      const retrieved = getPost(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.notes).toBe('Test notes')
    })

    it('should return undefined for non-existent ID', () => {
      const retrieved = getPost('non-existent-id')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('updatePost', () => {
    it('should update post notes', async () => {
      const post = createPost({
        platforms: ['twitter'],
        content: { twitter: { text: 'Original' } },
      })

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = updatePost(post.id, {
        notes: 'Added notes later',
      })

      expect(updated?.notes).toBe('Added notes later')
      expect(updated?.updatedAt).toBeDefined()
    })

    it('should update notes from existing value to new value', () => {
      const post = createPost({
        platforms: ['twitter'],
        content: { twitter: { text: 'Test' } },
        notes: 'Original notes',
      })

      const updated = updatePost(post.id, {
        notes: 'Updated notes',
      })

      expect(updated?.notes).toBe('Updated notes')
    })

    it('should clear notes by setting to empty string', () => {
      const post = createPost({
        platforms: ['twitter'],
        content: { twitter: { text: 'Test' } },
        notes: 'Some notes',
      })

      const updated = updatePost(post.id, {
        notes: '',
      })

      expect(updated?.notes).toBe('')
    })

    it('should update Reddit subreddits', () => {
      const post = createPost({
        platforms: ['reddit'],
        content: {
          reddit: {
            subreddits: ['startups'],
            title: 'Initial post',
          },
        },
      })

      const updated = updatePost(post.id, {
        content: {
          reddit: {
            subreddits: ['startups', 'SaaS', 'indiehackers'],
            title: 'Initial post',
          },
        },
      })

      expect(updated?.content.reddit?.subreddits).toEqual(['startups', 'SaaS', 'indiehackers'])
      expect(updated?.content.reddit?.subreddits).toHaveLength(3)
    })

    it('should remove subreddits from the array', () => {
      const post = createPost({
        platforms: ['reddit'],
        content: {
          reddit: {
            subreddits: ['startups', 'SaaS', 'webdev'],
            title: 'Test',
          },
        },
      })

      const updated = updatePost(post.id, {
        content: {
          reddit: {
            subreddits: ['startups'],
            title: 'Test',
          },
        },
      })

      expect(updated?.content.reddit?.subreddits).toEqual(['startups'])
      expect(updated?.content.reddit?.subreddits).toHaveLength(1)
    })

    it('should return undefined for non-existent post', () => {
      const result = updatePost('non-existent', { notes: 'test' })
      expect(result).toBeUndefined()
    })
  })

  describe('deletePost', () => {
    it('should delete an existing post', () => {
      const post = createPost({
        platforms: ['twitter'],
        content: { twitter: { text: 'Delete me' } },
      })

      const result = deletePost(post.id)
      expect(result).toBe(true)

      const retrieved = getPost(post.id)
      expect(retrieved).toBeUndefined()
    })

    it('should return false for non-existent post', () => {
      const result = deletePost('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('listPosts', () => {
    it('should list all posts', () => {
      createPost({ platforms: ['twitter'], content: { twitter: { text: '1' } } })
      createPost({ platforms: ['linkedin'], content: { linkedin: { text: '2', visibility: 'public' } } })
      createPost({ platforms: ['reddit'], content: { reddit: { subreddits: ['test'], title: '3' } } })

      const posts = listPosts()
      expect(posts).toHaveLength(3)
    })

    it('should filter by status', () => {
      createPost({ platforms: ['twitter'], content: { twitter: { text: '1' } }, status: 'draft' })
      createPost({ platforms: ['twitter'], content: { twitter: { text: '2' } }, status: 'scheduled' })

      const drafts = listPosts({ status: 'draft' })
      expect(drafts).toHaveLength(1)
      expect(drafts[0].status).toBe('draft')
    })

    it('should filter by platform', () => {
      createPost({ platforms: ['twitter'], content: { twitter: { text: '1' } } })
      createPost({ platforms: ['reddit'], content: { reddit: { subreddits: ['test'], title: '2' } } })

      const redditPosts = listPosts({ platform: 'reddit' })
      expect(redditPosts).toHaveLength(1)
      expect(redditPosts[0].platforms).toContain('reddit')
    })

    it('should limit results', () => {
      for (let i = 0; i < 10; i++) {
        createPost({ platforms: ['twitter'], content: { twitter: { text: `Post ${i}` } } })
      }

      const limited = listPosts({ limit: 5 })
      expect(limited).toHaveLength(5)
    })

    it('should include posts with notes in list', () => {
      createPost({
        platforms: ['twitter'],
        content: { twitter: { text: 'With notes' } },
        notes: 'Important reminder',
      })

      const posts = listPosts()
      expect(posts[0].notes).toBe('Important reminder')
    })

    it('should include posts with multiple subreddits in list', () => {
      createPost({
        platforms: ['reddit'],
        content: {
          reddit: {
            subreddits: ['startups', 'SaaS'],
            title: 'Multi-sub post',
          },
        },
      })

      const posts = listPosts({ platform: 'reddit' })
      expect(posts[0].content.reddit?.subreddits).toEqual(['startups', 'SaaS'])
    })
  })
})
