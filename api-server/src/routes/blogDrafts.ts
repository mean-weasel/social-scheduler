import { Router, Request, Response } from 'express'
import {
  createBlogDraft,
  getBlogDraft,
  updateBlogDraft,
  deleteBlogDraft,
  archiveBlogDraft,
  restoreBlogDraft,
  listBlogDrafts,
  searchBlogDrafts,
  addImageToDraft,
  removeImageFromDraft,
  isValidStatusTransition,
  clearAllBlogDrafts,
  BlogDraftStatus,
} from '../blogStorage.js'
import {
  copyImageToBlogMedia,
  getBlogMediaPath,
  blogMediaFileExists,
} from '../media.js'

export const blogDraftsRouter = Router()

// List blog drafts with optional filters
blogDraftsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { status, campaignId, limit, search } = req.query

    // If search query is provided, use search function
    if (search && typeof search === 'string') {
      const drafts = searchBlogDrafts(search, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
      })
      res.json({ drafts })
      return
    }

    const drafts = listBlogDrafts({
      status: status as BlogDraftStatus | 'all' | undefined,
      campaignId: campaignId as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    })

    res.json({ drafts })
  } catch (error) {
    console.error('Error listing blog drafts:', error)
    res.status(500).json({ error: 'Failed to list blog drafts' })
  }
})

// Search blog drafts
blogDraftsRouter.get('/search', (req: Request, res: Response) => {
  try {
    const { q, limit } = req.query

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query (q) is required' })
      return
    }

    const drafts = searchBlogDrafts(q, {
      limit: limit ? parseInt(limit as string, 10) : undefined,
    })

    res.json({ drafts })
  } catch (error) {
    console.error('Error searching blog drafts:', error)
    res.status(500).json({ error: 'Failed to search blog drafts' })
  }
})

// Get single blog draft
blogDraftsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const draft = getBlogDraft(req.params.id)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }
    res.json({ draft })
  } catch (error) {
    console.error('Error getting blog draft:', error)
    res.status(500).json({ error: 'Failed to get blog draft' })
  }
})

// Create blog draft
blogDraftsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { title, content, date, scheduledAt, status, notes, campaignId, images } = req.body

    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title is required and must be a string' })
      return
    }

    const draft = createBlogDraft({
      title,
      content: content || '',
      date: date || null,
      scheduledAt: scheduledAt || null,
      status: status || 'draft',
      notes,
      campaignId,
      images: images || [],
    })

    res.status(201).json({ draft })
  } catch (error) {
    console.error('Error creating blog draft:', error)
    res.status(500).json({ error: 'Failed to create blog draft' })
  }
})

// Update blog draft
blogDraftsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    // Validate status transition if status is being changed
    if (req.body.status) {
      const existing = getBlogDraft(req.params.id)
      if (!existing) {
        res.status(404).json({ error: 'Blog draft not found' })
        return
      }
      if (!isValidStatusTransition(existing.status, req.body.status)) {
        res.status(400).json({
          error: `Invalid status transition from '${existing.status}' to '${req.body.status}'`,
        })
        return
      }
    }

    const draft = updateBlogDraft(req.params.id, req.body)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }
    res.json({ draft })
  } catch (error) {
    console.error('Error updating blog draft:', error)
    res.status(500).json({ error: 'Failed to update blog draft' })
  }
})

// Delete blog draft
blogDraftsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const draft = getBlogDraft(req.params.id)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }

    // Note: We don't delete images here because they might be shared
    // Image cleanup should be done separately with a garbage collection approach

    const success = deleteBlogDraft(req.params.id)
    if (!success) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog draft:', error)
    res.status(500).json({ error: 'Failed to delete blog draft' })
  }
})

// Archive blog draft
blogDraftsRouter.post('/:id/archive', (req: Request, res: Response) => {
  try {
    const draft = archiveBlogDraft(req.params.id)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }
    res.json({ draft })
  } catch (error) {
    console.error('Error archiving blog draft:', error)
    res.status(500).json({ error: 'Failed to archive blog draft' })
  }
})

// Restore blog draft
blogDraftsRouter.post('/:id/restore', (req: Request, res: Response) => {
  try {
    const draft = restoreBlogDraft(req.params.id)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }
    res.json({ draft })
  } catch (error) {
    console.error('Error restoring blog draft:', error)
    res.status(500).json({ error: 'Failed to restore blog draft' })
  }
})

// ==================
// Image Management
// ==================

// List images for a draft
blogDraftsRouter.get('/:id/images', (req: Request, res: Response) => {
  try {
    const draft = getBlogDraft(req.params.id)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }
    res.json({ images: draft.images })
  } catch (error) {
    console.error('Error listing draft images:', error)
    res.status(500).json({ error: 'Failed to list draft images' })
  }
})

// Add image to draft (copy from file path)
blogDraftsRouter.post('/:id/images', async (req: Request, res: Response) => {
  try {
    const draft = getBlogDraft(req.params.id)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }

    const { sourcePath } = req.body
    if (!sourcePath || typeof sourcePath !== 'string') {
      res.status(400).json({ error: 'sourcePath is required' })
      return
    }

    // Copy image to blog-media
    const result = await copyImageToBlogMedia(sourcePath)

    // Add to draft's images array
    const updated = addImageToDraft(req.params.id, result.filename)
    if (!updated) {
      res.status(500).json({ error: 'Failed to update draft with new image' })
      return
    }

    res.status(201).json({
      filename: result.filename,
      size: result.size,
      mimetype: result.mimetype,
      markdown: `![image](/api/blog-media/${result.filename})`,
      draft: updated,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add image'
    console.error('Error adding image to draft:', error)
    res.status(400).json({ error: message })
  }
})

// Remove image from draft
blogDraftsRouter.delete('/:id/images/:filename', (req: Request, res: Response) => {
  try {
    const draft = removeImageFromDraft(req.params.id, req.params.filename)
    if (!draft) {
      res.status(404).json({ error: 'Blog draft not found' })
      return
    }

    // Note: We don't delete the actual file because it might be shared
    // or referenced in the markdown content

    res.json({ draft })
  } catch (error) {
    console.error('Error removing image from draft:', error)
    res.status(500).json({ error: 'Failed to remove image from draft' })
  }
})

// ==================
// Blog Media Serving
// ==================

// This needs to be registered at /api/blog-media/:filename in the main app
export const blogMediaRouter = Router()

blogMediaRouter.get('/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.status(400).json({ error: 'Invalid filename' })
      return
    }

    const filepath = getBlogMediaPath(filename)

    if (!blogMediaFileExists(filename)) {
      res.status(404).json({ error: 'Image not found' })
      return
    }

    // Set cache headers for immutable content
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    res.sendFile(filepath)
  } catch (error) {
    console.error('Error serving blog media:', error)
    res.status(500).json({ error: 'Failed to serve image' })
  }
})

// ==================
// Reset (for testing)
// ==================

blogDraftsRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const deleted = clearAllBlogDrafts()
    res.json({ success: true, deleted })
  } catch (error) {
    console.error('Error resetting blog drafts:', error)
    res.status(500).json({ error: 'Failed to reset blog drafts' })
  }
})
