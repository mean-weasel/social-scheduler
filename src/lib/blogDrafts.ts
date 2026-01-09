import { create } from 'zustand'

// API URL - use relative path for Next.js, fallback to Vite env or localhost
function getApiBase() {
  // Server-side or no window
  if (typeof window === 'undefined') {
    return '/api'
  }
  // Client-side: check if Vite or Next.js
  // Vite dev server runs on 5173, production builds don't have port in URL
  const isVite = window.location.port === '5173' || window.location.port === '5174'
  if (isVite) {
    // Check for Vite env var
    try {
      // Vite env vars
      return import.meta.env?.VITE_API_URL || 'http://localhost:3001/api'
    } catch {
      return 'http://localhost:3001/api'
    }
  }
  // Next.js or production: use relative path
  return '/api'
}

const API_BASE = getApiBase()

// Types
export type BlogDraftStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export interface BlogDraft {
  id: string
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  status: BlogDraftStatus
  title: string
  date: string | null
  content: string
  notes?: string
  wordCount: number
  campaignId?: string
  images: string[]
}

interface BlogDraftsState {
  drafts: BlogDraft[]
  loading: boolean
  error: string | null
  initialized: boolean
}

interface BlogDraftsActions {
  fetchDrafts: () => Promise<void>
  addDraft: (draft: Omit<BlogDraft, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'images'>) => Promise<BlogDraft>
  updateDraft: (id: string, updates: Partial<BlogDraft>) => Promise<void>
  deleteDraft: (id: string) => Promise<void>
  archiveDraft: (id: string) => Promise<void>
  restoreDraft: (id: string) => Promise<void>
  getDraft: (id: string) => BlogDraft | undefined
  getDraftsByStatus: (status?: BlogDraftStatus) => BlogDraft[]
  searchDrafts: (query: string) => Promise<BlogDraft[]>
}

export const useBlogDraftsStore = create<BlogDraftsState & BlogDraftsActions>()((set, get) => ({
  drafts: [],
  loading: false,
  error: null,
  initialized: false,

  fetchDrafts: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/blog-drafts`)
      if (!res.ok) throw new Error('Failed to fetch blog drafts')
      const data = await res.json()
      set({ drafts: data.drafts || [], loading: false, initialized: true })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  addDraft: async (draftData) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/blog-drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftData),
      })
      if (!res.ok) throw new Error('Failed to create blog draft')
      const data = await res.json()
      const newDraft = data.draft as BlogDraft
      set((state) => ({
        drafts: [newDraft, ...state.drafts],
        loading: false,
      }))
      return newDraft
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  updateDraft: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/blog-drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update blog draft')
      const data = await res.json()
      const updatedDraft = data.draft as BlogDraft
      set((state) => ({
        drafts: state.drafts.map((d) => (d.id === id ? updatedDraft : d)),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  deleteDraft: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/blog-drafts/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete blog draft')
      set((state) => ({
        drafts: state.drafts.filter((d) => d.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  archiveDraft: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/blog-drafts/${id}/archive`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to archive blog draft')
      const data = await res.json()
      const archivedDraft = data.draft as BlogDraft
      set((state) => ({
        drafts: state.drafts.map((d) => (d.id === id ? archivedDraft : d)),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  restoreDraft: async (id) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_BASE}/blog-drafts/${id}/restore`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to restore blog draft')
      const data = await res.json()
      const restoredDraft = data.draft as BlogDraft
      set((state) => ({
        drafts: state.drafts.map((d) => (d.id === id ? restoredDraft : d)),
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  getDraft: (id) => get().drafts.find((d) => d.id === id),

  getDraftsByStatus: (status) => {
    const drafts = get().drafts
    if (!status) return drafts
    return drafts.filter((d) => d.status === status)
  },

  searchDrafts: async (query) => {
    try {
      const res = await fetch(`${API_BASE}/blog-drafts/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Failed to search blog drafts')
      const data = await res.json()
      return data.drafts || []
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  },
}))
