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
} from '../storage.js'

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
    const { status, platform, limit } = req.query

    const posts = listPosts({
      status: status as PostStatus | 'all' | undefined,
      platform: platform as Platform | undefined,
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
    const { platforms, content, scheduledAt, status, notes, campaignId, groupId, groupType } = req.body

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      res.status(400).json({ error: 'platforms is required and must be a non-empty array' })
      return
    }

    if (!content || typeof content !== 'object') {
      res.status(400).json({ error: 'content is required and must be an object' })
      return
    }

    const post = createPost({
      platforms,
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
postsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
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
