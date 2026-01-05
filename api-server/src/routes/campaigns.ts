import { Router, Request, Response } from 'express'
import {
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  listCampaigns,
  getCampaignPosts,
  addPostToCampaign,
  removePostFromCampaign,
  CampaignStatus,
} from '../storage.js'

export const campaignsRouter = Router()

// List campaigns with optional filters
campaignsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { status, limit } = req.query

    const campaigns = listCampaigns({
      status: status as CampaignStatus | 'all' | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    })

    res.json({ campaigns })
  } catch (error) {
    console.error('Error listing campaigns:', error)
    res.status(500).json({ error: 'Failed to list campaigns' })
  }
})

// Get single campaign with its posts
campaignsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const campaign = getCampaign(req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }

    const posts = getCampaignPosts(req.params.id)
    res.json({ campaign, posts })
  } catch (error) {
    console.error('Error getting campaign:', error)
    res.status(500).json({ error: 'Failed to get campaign' })
  }
})

// Create campaign
campaignsRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, status } = req.body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required and must be a non-empty string' })
      return
    }

    const campaign = createCampaign({
      name: name.trim(),
      description: description || undefined,
      status: status || 'draft',
    })

    res.status(201).json({ campaign })
  } catch (error) {
    console.error('Error creating campaign:', error)
    res.status(500).json({ error: 'Failed to create campaign' })
  }
})

// Update campaign
campaignsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const campaign = updateCampaign(req.params.id, req.body)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    res.json({ campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)
    res.status(500).json({ error: 'Failed to update campaign' })
  }
})

// Delete campaign
campaignsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = deleteCampaign(req.params.id)
    if (!success) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    res.status(500).json({ error: 'Failed to delete campaign' })
  }
})

// Add post to campaign
campaignsRouter.post('/:id/posts', (req: Request, res: Response) => {
  try {
    const { postId } = req.body

    if (!postId || typeof postId !== 'string') {
      res.status(400).json({ error: 'postId is required' })
      return
    }

    // Check if campaign exists
    const campaign = getCampaign(req.params.id)
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' })
      return
    }

    const post = addPostToCampaign(postId, req.params.id)
    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }

    res.json({ post })
  } catch (error) {
    console.error('Error adding post to campaign:', error)
    res.status(500).json({ error: 'Failed to add post to campaign' })
  }
})

// Remove post from campaign
campaignsRouter.delete('/:id/posts/:postId', (req: Request, res: Response) => {
  try {
    const post = removePostFromCampaign(req.params.postId)
    if (!post) {
      res.status(404).json({ error: 'Post not found' })
      return
    }
    res.json({ post })
  } catch (error) {
    console.error('Error removing post from campaign:', error)
    res.status(500).json({ error: 'Failed to remove post from campaign' })
  }
})
