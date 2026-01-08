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
  createBlogDraft,
  getBlogDraft,
  updateBlogDraft,
  deleteBlogDraft,
  archiveBlogDraft,
  restoreBlogDraft,
  listBlogDrafts,
  searchBlogDrafts,
  addImageToBlogDraft,
  getDraftImages,
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

  describe('Blog Draft Operations', () => {
    describe('createBlogDraft', () => {
      it('should create a blog draft and return it', async () => {
        const mockDraft = {
          id: 'draft-123',
          title: 'Test Blog Post',
          content: '# Hello World\n\nThis is a test.',
          status: 'draft',
          wordCount: 6,
          images: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          scheduledAt: null,
          date: null,
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ draft: mockDraft }),
        })

        const result = await createBlogDraft({
          title: 'Test Blog Post',
          content: '# Hello World\n\nThis is a test.',
        })

        expect(result).toEqual(mockDraft)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts',
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
          json: async () => ({ error: 'Title is required' }),
        })

        await expect(
          createBlogDraft({ title: '' })
        ).rejects.toThrow('Failed to create blog draft')
      })

      it('should include optional fields when provided', async () => {
        const mockDraft = {
          id: 'draft-123',
          title: 'Test',
          content: 'Content',
          date: '2024-06-15',
          notes: 'Private notes',
          status: 'draft',
          campaignId: 'campaign-1',
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ draft: mockDraft }),
        })

        await createBlogDraft({
          title: 'Test',
          content: 'Content',
          date: '2024-06-15',
          notes: 'Private notes',
          campaignId: 'campaign-1',
        })

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
        expect(callBody.date).toBe('2024-06-15')
        expect(callBody.notes).toBe('Private notes')
        expect(callBody.campaignId).toBe('campaign-1')
      })
    })

    describe('getBlogDraft', () => {
      it('should return draft when found', async () => {
        const mockDraft = { id: 'draft-123', title: 'Test Post' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ draft: mockDraft }),
        })

        const result = await getBlogDraft('draft-123')
        expect(result).toEqual(mockDraft)
      })

      it('should return undefined when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await getBlogDraft('nonexistent')
        expect(result).toBeUndefined()
      })
    })

    describe('updateBlogDraft', () => {
      it('should update and return draft', async () => {
        const mockDraft = { id: 'draft-123', title: 'Updated Title', content: 'New content' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ draft: mockDraft }),
        })

        const result = await updateBlogDraft('draft-123', { title: 'Updated Title', content: 'New content' })
        expect(result).toEqual(mockDraft)
      })

      it('should return undefined when draft not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await updateBlogDraft('nonexistent', { title: 'Test' })
        expect(result).toBeUndefined()
      })
    })

    describe('deleteBlogDraft', () => {
      it('should return true on success', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
        })

        const result = await deleteBlogDraft('draft-123')
        expect(result).toBe(true)
      })

      it('should return false when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await deleteBlogDraft('nonexistent')
        expect(result).toBe(false)
      })
    })

    describe('archiveBlogDraft', () => {
      it('should archive and return draft', async () => {
        const mockDraft = { id: 'draft-123', status: 'archived' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ draft: mockDraft }),
        })

        const result = await archiveBlogDraft('draft-123')
        expect(result).toEqual(mockDraft)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts/draft-123/archive',
          { method: 'POST' }
        )
      })

      it('should return undefined when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await archiveBlogDraft('nonexistent')
        expect(result).toBeUndefined()
      })
    })

    describe('restoreBlogDraft', () => {
      it('should restore and return draft', async () => {
        const mockDraft = { id: 'draft-123', status: 'draft' }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ draft: mockDraft }),
        })

        const result = await restoreBlogDraft('draft-123')
        expect(result).toEqual(mockDraft)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts/draft-123/restore',
          { method: 'POST' }
        )
      })

      it('should return undefined when not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        const result = await restoreBlogDraft('nonexistent')
        expect(result).toBeUndefined()
      })
    })

    describe('listBlogDrafts', () => {
      it('should list drafts with no filters', async () => {
        const mockDrafts = [{ id: 'draft-1' }, { id: 'draft-2' }]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drafts: mockDrafts }),
        })

        const result = await listBlogDrafts()
        expect(result).toEqual(mockDrafts)
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/blog-drafts')
      })

      it('should include status filter in query params', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drafts: [] }),
        })

        await listBlogDrafts({ status: 'draft' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts?status=draft'
        )
      })

      it('should include campaignId filter in query params', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drafts: [] }),
        })

        await listBlogDrafts({ campaignId: 'campaign-123' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts?campaignId=campaign-123'
        )
      })

      it('should include search filter in query params', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drafts: [] }),
        })

        await listBlogDrafts({ search: 'hello' })
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts?search=hello'
        )
      })

      it('should combine multiple filters', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drafts: [] }),
        })

        await listBlogDrafts({
          status: 'draft',
          campaignId: 'campaign-1',
          limit: 10,
        })

        const url = mockFetch.mock.calls[0][0]
        expect(url).toContain('status=draft')
        expect(url).toContain('campaignId=campaign-1')
        expect(url).toContain('limit=10')
      })
    })

    describe('searchBlogDrafts', () => {
      it('should search drafts with query', async () => {
        const mockDrafts = [{ id: 'draft-1', title: 'Hello World' }]

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drafts: mockDrafts }),
        })

        const result = await searchBlogDrafts('hello')
        expect(result).toEqual(mockDrafts)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts/search?q=hello'
        )
      })

      it('should include limit option', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ drafts: [] }),
        })

        await searchBlogDrafts('test', { limit: 5 })
        const url = mockFetch.mock.calls[0][0]
        expect(url).toContain('q=test')
        expect(url).toContain('limit=5')
      })
    })

    describe('addImageToBlogDraft', () => {
      it('should add image and return result', async () => {
        const mockResult = {
          filename: 'image-abc123.png',
          size: 12345,
          mimetype: 'image/png',
          markdown: '![](http://localhost:3001/api/blog-media/image-abc123.png)',
          draft: { id: 'draft-123', images: ['image-abc123.png'] },
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResult,
        })

        const result = await addImageToBlogDraft('draft-123', '/path/to/image.png')
        expect(result).toEqual(mockResult)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts/draft-123/images',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourcePath: '/path/to/image.png' }),
          })
        )
      })

      it('should throw error when draft not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        await expect(
          addImageToBlogDraft('nonexistent', '/path/to/image.png')
        ).rejects.toThrow('Blog draft with ID nonexistent not found')
      })

      it('should throw error on invalid file', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'File exceeds 10MB limit' }),
        })

        await expect(
          addImageToBlogDraft('draft-123', '/path/to/large-image.png')
        ).rejects.toThrow('File exceeds 10MB limit')
      })
    })

    describe('getDraftImages', () => {
      it('should return list of image filenames', async () => {
        const mockImages = ['image1.png', 'image2.jpg']

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ images: mockImages }),
        })

        const result = await getDraftImages('draft-123')
        expect(result).toEqual(mockImages)
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/blog-drafts/draft-123/images'
        )
      })

      it('should throw error when draft not found', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
        })

        await expect(getDraftImages('nonexistent')).rejects.toThrow(
          'Blog draft with ID nonexistent not found'
        )
      })
    })
  })
})
