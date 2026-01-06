import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  archivePost,
  restorePost,
  listPosts,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  listCampaigns,
  addPostToCampaign,
  removePostFromCampaign,
} from './storage.js'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Storage Layer', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Post Operations', () => {
    describe('createPost', () => {
      it('should create a post and return it', async () => {
        const mockPost = {
          id: 'post-123',
          platform: 'twitter',
          content: { text: 'Hello world' },
          status: 'draft',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          scheduledAt: null,
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ post: mockPost }),
        })

        const result = await createPost({
          platform: 'twitter',
          content: { text: 'Hello world' },
        })

        expect(result).toEqual(mockPost)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/posts',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })

      it('should throw error on failure', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        })

        await expect(
          createPost({ platform: 'twitter', content: { text: '' } })
        ).rejects.toThrow('Failed to create post: Bad Request')
      })

      it('should include campaignId, groupId, groupType when provided', async () => {
        const mockPost = {
          id: 'post-123',
          platform: 'reddit',
          content: { subreddit: 'test', title: 'Test' },
          status: 'draft',
          campaignId: 'campaign-1',
          groupId: 'group-1',
          groupType: 'reddit-crosspost',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          scheduledAt: null,
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ post: mockPost }),
        })

        await createPost({
          platform: 'reddit',
          content: { subreddit: 'test', title: 'Test' },
          campaignId: 'campaign-1',
          groupId: 'group-1',
          groupType: 'reddit-crosspost',
        })

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(callBody.campaignId).toBe('campaign-1')
        expect(callBody.groupId).toBe('group-1')
        expect(callBody.groupType).toBe('reddit-crosspost')
      })
    })

    describe('getPost', () => {
      it('should return post when found', async () => {
        const mockPost = { id: 'post-123', platform: 'twitter' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ post: mockPost }),
        })

        const result = await getPost('post-123')
        expect(result).toEqual(mockPost)
      })

      it('should return undefined when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await getPost('nonexistent')
        expect(result).toBeUndefined()
      })
    })

    describe('updatePost', () => {
      it('should update and return post', async () => {
        const mockPost = { id: 'post-123', status: 'scheduled' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ post: mockPost }),
        })

        const result = await updatePost('post-123', { status: 'scheduled' })
        expect(result).toEqual(mockPost)
      })

      it('should return undefined when post not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await updatePost('nonexistent', { status: 'draft' })
        expect(result).toBeUndefined()
      })
    })

    describe('deletePost', () => {
      it('should return true on success', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        })

        const result = await deletePost('post-123')
        expect(result).toBe(true)
      })

      it('should return false when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await deletePost('nonexistent')
        expect(result).toBe(false)
      })
    })

    describe('archivePost', () => {
      it('should archive and return post', async () => {
        const mockPost = { id: 'post-123', status: 'archived' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ post: mockPost }),
        })

        const result = await archivePost('post-123')
        expect(result).toEqual(mockPost)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/posts/post-123/archive',
          { method: 'POST' }
        )
      })
    })

    describe('restorePost', () => {
      it('should restore and return post', async () => {
        const mockPost = { id: 'post-123', status: 'draft' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ post: mockPost }),
        })

        const result = await restorePost('post-123')
        expect(result).toEqual(mockPost)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/posts/post-123/restore',
          { method: 'POST' }
        )
      })
    })

    describe('listPosts', () => {
      it('should list posts with no filters', async () => {
        const mockPosts = [{ id: 'post-1' }, { id: 'post-2' }]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: mockPosts }),
        })

        const result = await listPosts()
        expect(result).toEqual(mockPosts)
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/posts')
      })

      it('should include status filter in query params', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: [] }),
        })

        await listPosts({ status: 'draft' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/posts?status=draft'
        )
      })

      it('should include campaignId filter in query params', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: [] }),
        })

        await listPosts({ campaignId: 'campaign-123' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/posts?campaignId=campaign-123'
        )
      })

      it('should include groupId filter in query params', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: [] }),
        })

        await listPosts({ groupId: 'group-123' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/posts?groupId=group-123'
        )
      })

      it('should combine multiple filters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ posts: [] }),
        })

        await listPosts({
          status: 'scheduled',
          platform: 'reddit',
          campaignId: 'campaign-1',
          limit: 10,
        })

        const url = mockFetch.mock.calls[0][0]
        expect(url).toContain('status=scheduled')
        expect(url).toContain('platform=reddit')
        expect(url).toContain('campaignId=campaign-1')
        expect(url).toContain('limit=10')
      })
    })
  })

  describe('Campaign Operations', () => {
    describe('createCampaign', () => {
      it('should create a campaign and return it', async () => {
        const mockCampaign = {
          id: 'campaign-123',
          name: 'Test Campaign',
          status: 'draft',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaign: mockCampaign }),
        })

        const result = await createCampaign({ name: 'Test Campaign' })
        expect(result).toEqual(mockCampaign)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/campaigns',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })

      it('should include optional fields when provided', async () => {
        const mockCampaign = {
          id: 'campaign-123',
          name: 'Test',
          description: 'A description',
          status: 'active',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaign: mockCampaign }),
        })

        await createCampaign({
          name: 'Test',
          description: 'A description',
          status: 'active',
        })

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(callBody.description).toBe('A description')
        expect(callBody.status).toBe('active')
      })

      it('should throw error on failure', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        })

        await expect(createCampaign({ name: 'Test' })).rejects.toThrow(
          'Failed to create campaign: Bad Request'
        )
      })
    })

    describe('getCampaign', () => {
      it('should return campaign with posts when found', async () => {
        const mockResult = {
          campaign: { id: 'campaign-123', name: 'Test' },
          posts: [{ id: 'post-1' }],
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResult,
        })

        const result = await getCampaign('campaign-123')
        expect(result).toEqual(mockResult)
      })

      it('should return undefined when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await getCampaign('nonexistent')
        expect(result).toBeUndefined()
      })
    })

    describe('updateCampaign', () => {
      it('should update and return campaign', async () => {
        const mockCampaign = { id: 'campaign-123', name: 'Updated', status: 'active' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaign: mockCampaign }),
        })

        const result = await updateCampaign('campaign-123', { name: 'Updated', status: 'active' })
        expect(result).toEqual(mockCampaign)
      })

      it('should return undefined when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await updateCampaign('nonexistent', { name: 'Test' })
        expect(result).toBeUndefined()
      })
    })

    describe('deleteCampaign', () => {
      it('should return true on success', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        })

        const result = await deleteCampaign('campaign-123')
        expect(result).toBe(true)
      })

      it('should return false when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await deleteCampaign('nonexistent')
        expect(result).toBe(false)
      })
    })

    describe('listCampaigns', () => {
      it('should list campaigns with no filters', async () => {
        const mockCampaigns = [{ id: 'campaign-1' }, { id: 'campaign-2' }]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaigns: mockCampaigns }),
        })

        const result = await listCampaigns()
        expect(result).toEqual(mockCampaigns)
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/campaigns')
      })

      it('should include status filter', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaigns: [] }),
        })

        await listCampaigns({ status: 'active' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/campaigns?status=active'
        )
      })

      it('should include limit filter', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ campaigns: [] }),
        })

        await listCampaigns({ limit: 10 })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/campaigns?limit=10'
        )
      })
    })

    describe('addPostToCampaign', () => {
      it('should add post to campaign and return updated post', async () => {
        const mockPost = { id: 'post-123', campaignId: 'campaign-123' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ post: mockPost }),
        })

        const result = await addPostToCampaign('campaign-123', 'post-123')
        expect(result).toEqual(mockPost)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/campaigns/campaign-123/posts',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ postId: 'post-123' }),
          })
        )
      })

      it('should return undefined when campaign or post not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await addPostToCampaign('nonexistent', 'post-123')
        expect(result).toBeUndefined()
      })
    })

    describe('removePostFromCampaign', () => {
      it('should remove post from campaign and return updated post', async () => {
        const mockPost = { id: 'post-123', campaignId: undefined }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ post: mockPost }),
        })

        const result = await removePostFromCampaign('campaign-123', 'post-123')
        expect(result).toEqual(mockPost)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/campaigns/campaign-123/posts/post-123',
          { method: 'DELETE' }
        )
      })

      it('should return undefined when post not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await removePostFromCampaign('campaign-123', 'nonexistent')
        expect(result).toBeUndefined()
      })
    })
  })
})
