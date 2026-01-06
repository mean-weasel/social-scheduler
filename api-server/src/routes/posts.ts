import { Router, Request, Response } from 'express'
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  archivePost,
  restorePost,
  listPosts,
  clearAll,
  Platform,
  PostStatus,
  isValidStatusTransition,
} from '../storage.js'
import { deletePostMedia } from '../media.js'

export const postsRouter = Router()

// Reset database (clear all posts and campaigns) - for testing and development
postsRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const deleted = clearAll()
    res.json({ success: true, deleted })
  } catch (error) {
    console.error('Error resetting database:', error)
    res.status(500).json({ error: 'Failed to reset database' })
  }
})

// List posts with optional filters
postsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { status, platform, campaignId, groupId, limit } = req.query

    const posts = listPosts({
      status: status as PostStatus | 'all' | undefined,
      platform: platform as Platform | undefined,
      campaignId: campaignId as string | undefined,
      groupId: groupId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    })

    res.json({ posts })
  } catch (error) {
    console.error('Error listing posts:', error)
    res.status(500).json({ error: 'Failed to list posts' })
  }
})

// Get single post
postsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const post = getPost(req.params.id)
    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.json({ post })
  } catch (error) {
    console.error('Error getting post:', error)
    res.status(500).json({ error: 'Failed to get post' })
  }
})

// Create post
postsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { platform, content, scheduledAt, status, notes, campaignId, groupId, groupType } = req.body

    const validPlatforms = ['twitter', 'linkedin', 'reddit']
    if (!platform || !validPlatforms.includes(platform)) {
      res.status(400).json({ error: 'platform is required and must be one of: twitter, linkedin, reddit' })
      return
    }

    if (!content || typeof content !== 'object') {
      res.status(400).json({ error: 'content is required and must be an object' })
      return
    }

    const post = createPost({
      platform,
      content,
      scheduledAt: scheduledAt || null,
      status: status || 'draft',
      notes,
      campaignId,
      groupId,
      groupType,
    })

    res.status(201).json({ post })
  } catch (error) {
    console.error('Error creating post:', error)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// Update post
postsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    // Validate status transition if status is being changed
    if (req.body.status) {
      const existing = getPost(req.params.id)
      if (!existing) {
        res.status(404).json({ error: 'Post not found' })
        return
      }
      if (!isValidStatusTransition(existing.status, req.body.status)) {
        res.status(400).json({
          error: `Invalid status transition from '${existing.status}' to '${req.body.status}'`
        })
        return
      }
    }

    const post = updatePost(req.params.id, req.body)
    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.json({ post })
  } catch (error) {
    console.error('Error updating post:', error)
    res.status(500).json({ error: 'Failed to update post' })
  }
})

// Delete post
postsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Get post first to extract media filenames for cleanup
    const post = getPost(req.params.id)
    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }

    // Delete associated media files
    const mediaDeleted = await deletePostMedia(post)
    if (mediaDeleted > 0) {
      console.log(`Deleted ${mediaDeleted} media file(s) for post ${req.params.id}`)
    }

    // Delete the post from database
    const success = deletePost(req.params.id)
    if (!success) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// Archive post
postsRouter.post('/:id/archive', (req: Request, res: Response) => {
  try {
    const post = archivePost(req.params.id)
    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.json({ post })
  } catch (error) {
    console.error('Error archiving post:', error)
    res.status(500).json({ error: 'Failed to archive post' })
  }
})

// Restore post
postsRouter.post('/:id/restore', (req: Request, res: Response) => {
  try {
    const post = restorePost(req.params.id)
    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.json({ post })
  } catch (error) {
    console.error('Error restoring post:', error)
    res.status(500).json({ error: 'Failed to restore post' })
  }
})
