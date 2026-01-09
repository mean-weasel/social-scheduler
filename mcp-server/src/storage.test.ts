import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Supabase client before importing storage
const mockSingle = vi.fn()
const mockFrom = vi.fn()

// Helper to create chainable query builder
const createQueryBuilder = () => {
  const builder: Record<string, unknown> = {}

  const chainable = (terminal = false) => {
    if (terminal) {
      return mockSingle
    }
    return vi.fn().mockReturnValue(builder)
  }

  builder.select = chainable()
  builder.insert = chainable()
  builder.update = chainable()
  builder.delete = chainable()
  builder.eq = chainable()
  builder.neq = chainable()
  builder.or = chainable()
  builder.order = chainable()
  builder.limit = chainable()
  builder.single = mockSingle

  return builder
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom.mockImplementation(() => createQueryBuilder()),
  })),
}))

// Set environment variables before importing storage
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

import {
  createPost,
  getPost,
  updatePost,
  archivePost,
  restorePost,
  createCampaign,
  createBlogDraft,
  getBlogDraft,
  updateBlogDraft,
} from './storage.js'

describe('Storage Layer (Supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mockFrom to return a fresh query builder each time
    mockFrom.mockImplementation(() => createQueryBuilder())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Post Operations', () => {
    it('should create a post and convert snake_case to camelCase', async () => {
      const mockDbRow = {
        id: 'post-123',
        platform: 'twitter',
        content: { text: 'Hello world' },
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        scheduled_at: null,
        notes: null,
        campaign_id: null,
        group_id: null,
        group_type: null,
        publish_result: null,
      }

      mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null })

      const result = await createPost({
        platform: 'twitter',
        content: { text: 'Hello world' },
      })

      expect(result.id).toBe('post-123')
      expect(result.createdAt).toBe('2024-01-01T00:00:00Z') // camelCase
      expect(result.updatedAt).toBe('2024-01-01T00:00:00Z') // camelCase
      expect(result.scheduledAt).toBeNull() // camelCase
      expect(mockFrom).toHaveBeenCalledWith('posts')
    })

    it('should throw error on create failure', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Bad Request', code: 'INVALID' },
      })

      await expect(
        createPost({ platform: 'twitter', content: { text: '' } })
      ).rejects.toThrow('Failed to create post: Bad Request')
    })

    it('should return undefined when post not found (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const result = await getPost('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should update post and return converted result', async () => {
      const mockDbRow = {
        id: 'post-123',
        platform: 'twitter',
        content: { text: 'Updated' },
        status: 'scheduled',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        scheduled_at: '2024-02-01T00:00:00Z',
        notes: null,
        campaign_id: null,
        group_id: null,
        group_type: null,
        publish_result: null,
      }

      mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null })

      const result = await updatePost('post-123', { status: 'scheduled' })
      expect(result?.status).toBe('scheduled')
      expect(result?.scheduledAt).toBe('2024-02-01T00:00:00Z')
    })

    it('should archive post by setting status to archived', async () => {
      const mockDbRow = {
        id: 'post-123',
        platform: 'twitter',
        content: { text: 'test' },
        status: 'archived',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        scheduled_at: null,
        notes: null,
        campaign_id: null,
        group_id: null,
        group_type: null,
        publish_result: null,
      }

      mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null })

      const result = await archivePost('post-123')
      expect(result?.status).toBe('archived')
    })

    it('should restore post by setting status to draft', async () => {
      const mockDbRow = {
        id: 'post-123',
        platform: 'twitter',
        content: { text: 'test' },
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        scheduled_at: null,
        notes: null,
        campaign_id: null,
        group_id: null,
        group_type: null,
        publish_result: null,
      }

      mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null })

      const result = await restorePost('post-123')
      expect(result?.status).toBe('draft')
    })
  })

  describe('Campaign Operations', () => {
    it('should create a campaign and convert snake_case to camelCase', async () => {
      const mockDbRow = {
        id: 'campaign-123',
        name: 'Test Campaign',
        description: null,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null })

      const result = await createCampaign({ name: 'Test Campaign' })
      expect(result.id).toBe('campaign-123')
      expect(result.createdAt).toBe('2024-01-01T00:00:00Z') // camelCase
      expect(result.updatedAt).toBe('2024-01-01T00:00:00Z') // camelCase
    })
  })

  describe('Blog Draft Operations', () => {
    it('should create a blog draft and convert snake_case to camelCase', async () => {
      const mockDbRow = {
        id: 'draft-123',
        title: 'Test Blog Post',
        content: '# Hello World\n\nThis is a test.',
        status: 'draft',
        word_count: 6,
        images: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        scheduled_at: null,
        date: null,
        notes: null,
        campaign_id: null,
      }

      mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null })

      const result = await createBlogDraft({
        title: 'Test Blog Post',
        content: '# Hello World\n\nThis is a test.',
      })

      expect(result.id).toBe('draft-123')
      expect(result.title).toBe('Test Blog Post')
      expect(result.wordCount).toBe(6) // camelCase
      expect(result.createdAt).toBe('2024-01-01T00:00:00Z') // camelCase
    })

    it('should return undefined when blog draft not found', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const result = await getBlogDraft('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should update blog draft and recalculate word count', async () => {
      const mockDbRow = {
        id: 'draft-123',
        title: 'Updated Title',
        content: 'New content here with more words',
        status: 'draft',
        word_count: 6,
        images: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        scheduled_at: null,
        date: null,
        notes: null,
        campaign_id: null,
      }

      mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null })

      const result = await updateBlogDraft('draft-123', {
        title: 'Updated Title',
        content: 'New content here with more words',
      })

      expect(result?.title).toBe('Updated Title')
      expect(result?.wordCount).toBe(6)
    })
  })
})
