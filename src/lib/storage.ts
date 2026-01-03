import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Post, PostStatus } from './posts'

interface PostsState {
  posts: Post[]
}

interface PostsActions {
  addPost: (post: Post) => void
  updatePost: (id: string, updates: Partial<Post>) => void
  deletePost: (id: string) => void
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

      getPost: (id) => get().posts.find((p) => p.id === id),

      getPostsByStatus: (status) => {
        const posts = get().posts
        if (!status) return posts
        return posts.filter((p) => p.status === status)
      },
    }),
    {
      name: 'social-scheduler-posts',
    }
  )
)
