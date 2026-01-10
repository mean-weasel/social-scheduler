import { create } from 'zustand'
import { Campaign, CampaignStatus, Post } from './posts'

// API URL - use relative path for Next.js API routes
const API_BASE = '/api'

interface CampaignsState {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  initialized: boolean
}

interface CampaignsActions {
  fetchCampaigns: () => Promise<void>
  addCampaign: (campaign: { name: string; description?: string; status?: CampaignStatus }) => Promise<Campaign>
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  getCampaign: (id: string) => Campaign | undefined
  getCampaignsByStatus: (status?: CampaignStatus) => Campaign[]
  getCampaignWithPosts: (id: string) => Promise<{ campaign: Campaign; posts: Post[] } | undefined>
  addPostToCampaign: (campaignId: string, postId: string) => Promise<void>
  removePostFromCampaign: (campaignId: string, postId: string) => Promise<void>
}

export const useCampaignsStore = create<CampaignsState & CampaignsActions>()((set, get) => ({
  campaigns: [],
  loading: false,
  error: null,
  initialized: false,

  fetchCampaigns: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/campaigns`)
      if (!res.ok) throw new Error('Failed to fetch campaigns')
      const data = await res.json()
      set({ campaigns: data.campaigns || [], loading: false, initialized: true })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  addCampaign: async (campaignData) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      })
      if (!res.ok) throw new Error('Failed to create campaign')
      const data = await res.json()
      const newCampaign = data.campaign as Campaign
      set((state) => ({
        campaigns: [newCampaign, ...state.campaigns],
        loading: false,
      }))
      return newCampaign
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  updateCampaign: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update campaign')
      const data = await res.json()
      const updatedCampaign = data.campaign as Campaign
      set((state) => ({
        campaigns: state.campaigns.map((c) => (c.id === id ? updatedCampaign : c)),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  deleteCampaign: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete campaign')
      set((state) => ({
        campaigns: state.campaigns.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  getCampaign: (id) => get().campaigns.find((c) => c.id === id),

  getCampaignsByStatus: (status) => {
    const campaigns = get().campaigns
    if (!status) return campaigns
    return campaigns.filter((c) => c.status === status)
  },

  getCampaignWithPosts: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${id}`)
      if (!res.ok) return undefined
      const data = await res.json()
      return { campaign: data.campaign as Campaign, posts: data.posts as Post[] }
    } catch {
      return undefined
    }
  },

  addPostToCampaign: async (campaignId, postId) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      if (!res.ok) throw new Error('Failed to add post to campaign')
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },

  removePostFromCampaign: async (campaignId, postId) => {
    try {
      const res = await fetch(`${API_BASE}/campaigns/${campaignId}/posts/${postId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove post from campaign')
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    }
  },
}))
