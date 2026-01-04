import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Post, PostStatus, migratePost } from './posts'

interface PostsState {
  posts: Post[]
}

interface PostsActions {
  addPost: (post: Post) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  deletePost: (id: string) => void
  archivePost: (id: string) => void
  restorePost: (id: string) => void
  getPost: (id: string) => Post | undefined
  getPostsByStatus: (status?: PostStatus) => Post[]
}

export const usePostsStore = create<PostsState & PostsActions>()(
  persist(
    (set, get) => ({
      posts: [],

      addPost: (post) =>
        set((state) => ({
          posts: [...state.posts, post],
        })),

      updatePost: (id, updates) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      deletePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),

      archivePost: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? { ...p, status: 'archived' as const, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      restorePost: (id) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id
              ? { ...p, status: 'draft' as const, scheduledAt: null, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      getPost: (id) => get().posts.find((p) => p.id === id),

      getPostsByStatus: (status) => {
        const posts = get().posts
        if (!status) return posts
        return posts.filter((p) => p.status === status)
      },
    }),
    {
      name: 'social-scheduler-posts',
      // Migrate legacy posts on load (subreddit → subreddits)
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PostsState | undefined
        if (!persisted?.posts) return currentState
        return {
          ...currentState,
          posts: persisted.posts.map(migratePost),
        }
      },
    }
  )
)
