import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  Image,
  Send,
  Save,
  Check,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { getPost, savePost, movePost, deletePost } from '@/lib/github'
import {
  Post,
  Platform,
  createPost,
  CHAR_LIMITS,
  PLATFORM_INFO,
  getFolder,
} from '@/lib/posts'
import { cn } from '@/lib/utils'

// Platform icons
const PlatformIcon = ({ platform }: { platform: Platform }) => {
  if (platform === 'twitter') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  }
  if (platform === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249z" />
    </svg>
  )
}

export function Editor() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token, config } = useAuth()

  const isNew = !id

  // Form state
  const [post, setPost] = useState<Post>(() => {
    const newPost = createPost()
    const dateParam = searchParams.get('date')
    if (dateParam) {
      newPost.scheduledAt = `${dateParam}T12:00:00.000Z`
    }
    return newPost
  })
  const [content, setContent] = useState('')

  // Fetch existing post
  const { data: existingPost, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!token || !config || !id) return null
      return getPost(token, config, id)
    },
    enabled: !!token && !!config && !!id,
  })

  // Load existing post data into form
  useEffect(() => {
    if (existingPost) {
      setPost(existingPost)
      // Set content from the first available platform
      const text =
        existingPost.content.twitter?.text ||
        existingPost.content.linkedin?.text ||
        existingPost.content.reddit?.body ||
        ''
      setContent(text)
    }
  }, [existingPost])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (postToSave: Post) => {
      if (!token || !config) throw new Error('Not authenticated')

      const oldFolder = id ? getFolder((await getPost(token, config, id))?.status || 'draft') : null
      const newFolder = getFolder(postToSave.status)

      if (oldFolder && oldFolder !== newFolder) {
        await movePost(token, config, postToSave, oldFolder, newFolder)
      } else {
        await savePost(token, config, postToSave)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate('/')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!token || !config || !id || !existingPost) throw new Error('Cannot delete')
      const folder = getFolder(existingPost.status)
      await deletePost(token, config, id, folder)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate('/')
    },
  })

  // Handle delete
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  // Toggle platform
  const togglePlatform = (platform: Platform) => {
    setPost((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  // Update content for all selected platforms
  useEffect(() => {
    setPost((prev) => {
      const updated = { ...prev, content: { ...prev.content } }
      for (const platform of prev.platforms) {
        if (platform === 'twitter') {
          updated.content.twitter = { text: content }
        } else if (platform === 'linkedin') {
          updated.content.linkedin = { text: content, visibility: 'public' }
        } else if (platform === 'reddit') {
          updated.content.reddit = {
            ...updated.content.reddit,
            subreddit: updated.content.reddit?.subreddit || '',
            title: updated.content.reddit?.title || '',
            body: content,
          }
        }
      }
      return updated
    })
  }, [content])

  // Save as draft
  const handleSaveDraft = () => {
    const toSave = { ...post, status: 'draft' as const }
    saveMutation.mutate(toSave)
  }

  // Schedule
  const handleSchedule = () => {
    if (!post.scheduledAt) {
      alert('Please select a date and time')
      return
    }
    const toSave = { ...post, status: 'scheduled' as const }
    saveMutation.mutate(toSave)
  }

  // Publish Now - schedules for immediate publishing
  const handlePublishNow = () => {
    if (post.platforms.length === 0) {
      alert('Please select at least one platform')
      return
    }
    if (!content.trim()) {
      alert('Please add some content')
      return
    }
    const toSave = {
      ...post,
      status: 'scheduled' as const,
      scheduledAt: new Date().toISOString(), // Schedule for now
    }
    saveMutation.mutate(toSave)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] min-h-[calc(100vh-4rem)]">
      {/* Editor */}
      <div className="p-8 max-w-2xl animate-slide-up">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-semibold mb-2">
            {isNew ? 'Create Post' : 'Edit Post'}
          </h1>
          <p className="text-muted-foreground">
            Compose your message and schedule it across multiple platforms.
          </p>
        </div>

        {/* Platform selector */}
        <div className="flex gap-2 mb-6">
          {(['twitter', 'linkedin', 'reddit'] as Platform[]).map((platform) => {
            const isActive = post.platforms.includes(platform)
            const info = PLATFORM_INFO[platform]
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all',
                  'font-medium text-sm',
                  isActive
                    ? platform === 'twitter'
                      ? 'border-twitter bg-twitter-soft text-twitter'
                      : platform === 'linkedin'
                        ? 'border-linkedin bg-linkedin-soft text-linkedin'
                        : 'border-reddit bg-reddit-soft text-reddit'
                    : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-accent'
                )}
              >
                <PlatformIcon platform={platform} />
                {info.name.split(' ')[0]}
                {isActive && <Check className="w-4 h-4 ml-1" />}
              </button>
            )
          })}
        </div>

        {/* Content textarea */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your thoughts, announce something exciting, or start a conversation..."
            className={cn(
              'w-full min-h-[200px] p-4 rounded-xl',
              'bg-card border border-border',
              'text-base leading-relaxed',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
              'resize-y transition-all'
            )}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-4">
              {post.platforms.map((platform) => {
                const limit = CHAR_LIMITS[platform]
                const len = content.length
                const pct = (len / limit) * 100
                return (
                  <div key={platform} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        platform === 'twitter' && 'bg-twitter',
                        platform === 'linkedin' && 'bg-linkedin',
                        platform === 'reddit' && 'bg-reddit'
                      )}
                    />
                    <span
                      className={cn(
                        'font-mono font-medium',
                        pct > 100 ? 'text-destructive' : pct > 90 ? 'text-yellow-500' : 'text-muted-foreground'
                      )}
                    >
                      {len}
                    </span>
                    <span className="text-muted-foreground">/ {limit}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-1">
              <button className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Image className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reddit-specific fields */}
        {post.platforms.includes('reddit') && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-card space-y-4 animate-slide-up">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Subreddit
                </label>
                <input
                  type="text"
                  value={post.content.reddit?.subreddit || ''}
                  onChange={(e) =>
                    setPost((prev) => ({
                      ...prev,
                      content: {
                        ...prev.content,
                        reddit: { ...prev.content.reddit!, subreddit: e.target.value },
                      },
                    }))
                  }
                  placeholder="e.g., SideProject"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Flair
                </label>
                <select className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:border-primary">
                  <option>Show and Tell</option>
                  <option>Question</option>
                  <option>Resource</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Post Title
              </label>
              <input
                type="text"
                value={post.content.reddit?.title || ''}
                onChange={(e) =>
                  setPost((prev) => ({
                    ...prev,
                    content: {
                      ...prev.content,
                      reddit: { ...prev.content.reddit!, title: e.target.value },
                    },
                  }))
                }
                placeholder="Title for your Reddit post"
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Schedule Date
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border cursor-pointer hover:border-border transition-colors">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={post.scheduledAt ? format(new Date(post.scheduledAt), 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  setPost((prev) => ({
                    ...prev,
                    scheduledAt: e.target.value
                      ? `${e.target.value}T${prev.scheduledAt ? format(new Date(prev.scheduledAt), 'HH:mm') : '12:00'}:00.000Z`
                      : null,
                  }))
                }
                className="bg-transparent border-none focus:outline-none flex-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Time
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border cursor-pointer hover:border-border transition-colors">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <input
                type="time"
                value={post.scheduledAt ? format(new Date(post.scheduledAt), 'HH:mm') : ''}
                onChange={(e) =>
                  setPost((prev) => ({
                    ...prev,
                    scheduledAt: prev.scheduledAt
                      ? `${format(new Date(prev.scheduledAt), 'yyyy-MM-dd')}T${e.target.value}:00.000Z`
                      : null,
                  }))
                }
                className="bg-transparent border-none focus:outline-none flex-1"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-border">
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg',
                'text-destructive hover:bg-destructive/10',
                'font-medium text-sm',
                'transition-colors',
                'disabled:opacity-50'
              )}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={saveMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-secondary text-secondary-foreground border border-border',
              'font-medium text-sm',
              'hover:bg-accent transition-colors',
              'disabled:opacity-50',
              !isNew && 'ml-auto'
            )}
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={handleSchedule}
            disabled={saveMutation.isPending || post.platforms.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-gradient-to-r from-twitter to-[#0d8bd9] text-white',
              'font-medium text-sm',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50'
            )}
          >
            <Calendar className="w-4 h-4" />
            Schedule Post
          </button>
          <button
            onClick={handlePublishNow}
            disabled={saveMutation.isPending || post.platforms.length === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'text-muted-foreground',
              'font-medium text-sm',
              'hover:bg-accent hover:text-foreground transition-colors',
              'disabled:opacity-50',
              isNew && 'ml-auto'
            )}
          >
            <Send className="w-4 h-4" />
            Publish Now
          </button>
        </div>
      </div>

      {/* Preview panel */}
      <div className="border-l border-border bg-card p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Preview
          </h3>
        </div>

        {post.platforms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Select a platform to see preview
          </p>
        ) : (
          <div className="space-y-4">
            {post.platforms.includes('twitter') && (
              <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-2 text-twitter text-xs font-medium mb-2">
                  <span className="w-2 h-2 rounded-full bg-twitter" />
                  Twitter / X
                </div>
                <div className="bg-[#15202B] rounded-2xl p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div>
                      <div className="font-bold text-[15px] text-[#E7E9EA]">Your Name</div>
                      <div className="text-[15px] text-[#71767B]">@yourhandle</div>
                    </div>
                  </div>
                  <div className="text-[15px] leading-[1.4] text-[#E7E9EA] whitespace-pre-wrap">
                    {content || 'Your tweet will appear here...'}
                  </div>
                </div>
              </div>
            )}

            {post.platforms.includes('linkedin') && (
              <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2 text-linkedin text-xs font-medium mb-2">
                  <span className="w-2 h-2 rounded-full bg-linkedin" />
                  LinkedIn
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                    <div>
                      <div className="font-semibold text-sm text-black">Your Name</div>
                      <div className="text-xs text-gray-600">Software Engineer at Company</div>
                      <div className="text-xs text-gray-600">Just now</div>
                    </div>
                  </div>
                  <div className="text-sm leading-[1.5] text-black whitespace-pre-wrap">
                    {content || 'Your LinkedIn post will appear here...'}
                  </div>
                </div>
              </div>
            )}

            {post.platforms.includes('reddit') && (
              <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 text-reddit text-xs font-medium mb-2">
                  <span className="w-2 h-2 rounded-full bg-reddit" />
                  Reddit
                </div>
                <div className="bg-[#1A1A1B] border border-[#343536] rounded">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#818384]">
                    <span className="font-bold text-[#D7DADC]">
                      r/{post.content.reddit?.subreddit || 'subreddit'}
                    </span>
                    • Posted by u/yourname
                  </div>
                  <div className="px-3 text-lg font-medium text-[#D7DADC]">
                    {post.content.reddit?.title || 'Your post title'}
                  </div>
                  <div className="p-3 text-sm text-[#D7DADC] whitespace-pre-wrap">
                    {content || 'Your Reddit post will appear here...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
