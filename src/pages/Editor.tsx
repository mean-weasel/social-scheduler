import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  Image,
  Send,
  Save,
  Check,
  Trash2,
  X,
  Plus,
  Copy,
  CheckCircle,
} from 'lucide-react'
import { usePostsStore } from '@/lib/storage'
import {
  Post,
  Platform,
  createPost,
  CHAR_LIMITS,
  PLATFORM_INFO,
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
  const { addPost, updatePost, deletePost, getPost } = usePostsStore()

  const isNew = !id
  const existingPost = id ? getPost(id) : undefined
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form state
  const [post, setPost] = useState<Post>(() => {
    if (existingPost) return existingPost
    const newPost = createPost()
    const dateParam = searchParams.get('date')
    if (dateParam) {
      newPost.scheduledAt = `${dateParam}T12:00:00.000Z`
    }
    return newPost
  })
  const [content, setContent] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [showMediaInput, setShowMediaInput] = useState(false)
  const [newMediaUrl, setNewMediaUrl] = useState('')

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
      // Load mediaUrls from Twitter content
      if (existingPost.content.twitter?.mediaUrls) {
        setMediaUrls(existingPost.content.twitter.mediaUrls)
      }
    }
  }, [existingPost])

  // Handle save
  const handleSave = (postToSave: Post) => {
    setIsSaving(true)
    if (isNew) {
      addPost(postToSave)
    } else {
      updatePost(postToSave.id, postToSave)
    }
    setIsSaving(false)
    navigate('/')
  }

  // Handle delete
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      if (id) {
        deletePost(id)
        navigate('/')
      }
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
          updated.content.twitter = {
            text: content,
            ...(mediaUrls.length > 0 && { mediaUrls })
          }
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
  }, [content, mediaUrls])

  // Save as draft
  const handleSaveDraft = () => {
    const toSave = { ...post, status: 'draft' as const }
    handleSave(toSave)
  }

  // Schedule
  const handleSchedule = () => {
    if (!post.scheduledAt) {
      alert('Please select a date and time')
      return
    }
    const toSave = { ...post, status: 'scheduled' as const }
    handleSave(toSave)
  }

  // Publish Now - schedules for immediate publishing (reminder)
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
      scheduledAt: new Date().toISOString(), // Schedule for now (triggers immediate notification)
    }
    handleSave(toSave)
  }

  // Copy content to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Mark as posted (published)
  const handleMarkAsPosted = () => {
    const toSave = {
      ...post,
      status: 'published' as const,
      publishResults: {
        ...post.publishResults,
        ...post.platforms.reduce((acc, platform) => ({
          ...acc,
          [platform]: {
            success: true,
            publishedAt: new Date().toISOString(),
          },
        }), {}),
      },
    }
    handleSave(toSave)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] min-h-[calc(100vh-4rem)]">
      {/* Editor */}
      <div className="p-4 md:p-8 max-w-2xl animate-slide-up">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-display font-semibold mb-1 md:mb-2">
            {isNew ? 'Create Post' : 'Edit Post'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Compose your message and schedule it across multiple platforms.
          </p>
        </div>

        {/* Platform selector */}
        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
          {(['twitter', 'linkedin', 'reddit'] as Platform[]).map((platform) => {
            const isActive = post.platforms.includes(platform)
            const info = PLATFORM_INFO[platform]
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={cn(
                  'flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 transition-all',
                  'font-medium text-sm min-h-[44px]', // 44px minimum touch target
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
                <span className="hidden sm:inline">{info.name.split(' ')[0]}</span>
                {isActive && <Check className="w-4 h-4 sm:ml-1" />}
              </button>
            )
          })}
        </div>

        {/* Content textarea */}
        <div className="mb-4 md:mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your thoughts, announce something exciting, or start a conversation..."
            className={cn(
              'w-full min-h-[150px] md:min-h-[200px] p-3 md:p-4 rounded-xl',
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
              <button
                onClick={handleCopy}
                disabled={!content.trim()}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  copied
                    ? 'bg-green-500/10 text-green-500'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowMediaInput(!showMediaInput)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  showMediaInput || mediaUrls.length > 0
                    ? 'bg-twitter/10 text-twitter'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
                title="Add media (images/videos)"
              >
                <Image className="w-4 h-4" />
                {mediaUrls.length > 0 && (
                  <span className="ml-1 text-xs">{mediaUrls.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Media URLs (for Twitter) */}
        {showMediaInput && post.platforms.includes('twitter') && (
          <div className="mb-6 p-4 rounded-xl border border-twitter/30 bg-twitter-soft/30 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-twitter text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-twitter" />
                Media URLs (Cloudinary)
              </div>
              <button
                onClick={() => setShowMediaInput(false)}
                className="p-1 rounded hover:bg-twitter/20 text-twitter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Add Cloudinary URLs for images or videos. Twitter supports up to 4 images or 1 video.
            </p>

            {/* Existing media */}
            {mediaUrls.length > 0 && (
              <div className="space-y-2 mb-3">
                {mediaUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={url}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-muted-foreground"
                    />
                    <button
                      onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new media */}
            {mediaUrls.length < 4 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-twitter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMediaUrl.trim()) {
                      setMediaUrls([...mediaUrls, newMediaUrl.trim()])
                      setNewMediaUrl('')
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newMediaUrl.trim()) {
                      setMediaUrls([...mediaUrls, newMediaUrl.trim()])
                      setNewMediaUrl('')
                    }
                  }}
                  disabled={!newMediaUrl.trim()}
                  className="p-2 rounded-lg bg-twitter text-white hover:bg-twitter/90 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* LinkedIn-specific fields */}
        {post.platforms.includes('linkedin') && (
          <div className="mb-6 p-4 rounded-xl border border-linkedin/30 bg-linkedin-soft/30 animate-slide-up">
            <div className="flex items-center gap-2 text-linkedin text-xs font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-linkedin" />
              LinkedIn Settings
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Visibility
              </label>
              <div className="flex gap-2">
                {(['public', 'connections'] as const).map((vis) => (
                  <button
                    key={vis}
                    type="button"
                    onClick={() =>
                      setPost((prev) => ({
                        ...prev,
                        content: {
                          ...prev.content,
                          linkedin: {
                            ...prev.content.linkedin!,
                            visibility: vis,
                          },
                        },
                      }))
                    }
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                      post.content.linkedin?.visibility === vis
                        ? 'border-linkedin bg-linkedin/10 text-linkedin'
                        : 'border-border bg-background text-muted-foreground hover:border-linkedin/50'
                    )}
                  >
                    {vis === 'public' ? 'Public' : 'Connections Only'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reddit-specific fields */}
        {post.platforms.includes('reddit') && (
          <div className="mb-6 p-4 rounded-xl border border-reddit/30 bg-reddit-soft/30 space-y-4 animate-slide-up">
            <div className="flex items-center gap-2 text-reddit text-xs font-medium mb-1">
              <span className="w-2 h-2 rounded-full bg-reddit" />
              Reddit Settings
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Subreddit
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 rounded-l-lg bg-muted border border-r-0 border-border text-muted-foreground text-sm">
                    r/
                  </span>
                  <input
                    type="text"
                    value={post.content.reddit?.subreddit || ''}
                    onChange={(e) =>
                      setPost((prev) => ({
                        ...prev,
                        content: {
                          ...prev.content,
                          reddit: { ...prev.content.reddit!, subreddit: e.target.value.replace(/^r\//, '') },
                        },
                      }))
                    }
                    placeholder="SideProject"
                    className="flex-1 px-4 py-2.5 rounded-r-lg bg-background border border-border focus:outline-none focus:border-reddit"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Flair (optional)
                </label>
                <input
                  type="text"
                  value={post.content.reddit?.flairText || ''}
                  onChange={(e) =>
                    setPost((prev) => ({
                      ...prev,
                      content: {
                        ...prev.content,
                        reddit: { ...prev.content.reddit!, flairText: e.target.value },
                      },
                    }))
                  }
                  placeholder="e.g., Show and Tell"
                  className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:border-reddit"
                />
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
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-border focus:outline-none focus:border-reddit"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {(post.content.reddit?.title || '').length} / 300 characters
              </p>
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
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
        <div className="flex flex-wrap gap-2 md:gap-3 pt-4 md:pt-6 border-t border-border">
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg min-h-[44px]',
                'text-destructive hover:bg-destructive/10',
                'font-medium text-sm',
                'transition-colors',
                'disabled:opacity-50'
              )}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className={cn(
              'flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg min-h-[44px]',
              'bg-secondary text-secondary-foreground border border-border',
              'font-medium text-sm',
              'hover:bg-accent transition-colors',
              'disabled:opacity-50',
              !isNew && 'sm:ml-auto'
            )}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Draft</span>
            <span className="sm:hidden">Draft</span>
          </button>
          <button
            onClick={handleSchedule}
            disabled={isSaving || post.platforms.length === 0}
            className={cn(
              'flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg min-h-[44px]',
              'bg-gradient-to-r from-twitter to-[#0d8bd9] text-white',
              'font-medium text-sm',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50'
            )}
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </button>
          <button
            onClick={handlePublishNow}
            disabled={isSaving || post.platforms.length === 0}
            className={cn(
              'flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg min-h-[44px]',
              'text-muted-foreground',
              'font-medium text-sm',
              'hover:bg-accent hover:text-foreground transition-colors',
              'disabled:opacity-50',
              isNew && 'sm:ml-auto'
            )}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Publish Now</span>
            <span className="sm:hidden">Publish</span>
          </button>
          {!isNew && post.status !== 'published' && (
            <button
              onClick={handleMarkAsPosted}
              disabled={isSaving || post.platforms.length === 0}
              className={cn(
                'flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg min-h-[44px]',
                'bg-green-500/10 text-green-600 dark:text-green-400',
                'font-medium text-sm',
                'hover:bg-green-500/20 transition-colors',
                'disabled:opacity-50'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Mark as Posted</span>
              <span className="sm:hidden">Posted</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview panel - hidden on mobile */}
      <div className="hidden lg:block border-l border-border bg-card p-6 overflow-y-auto">
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
                  {mediaUrls.length > 0 && (
                    <div className={cn(
                      'mt-3 grid gap-1 rounded-xl overflow-hidden',
                      mediaUrls.length === 1 && 'grid-cols-1',
                      mediaUrls.length === 2 && 'grid-cols-2',
                      mediaUrls.length >= 3 && 'grid-cols-2'
                    )}>
                      {mediaUrls.slice(0, 4).map((url, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'relative bg-[#1D2A35] flex items-center justify-center',
                            mediaUrls.length === 1 ? 'h-48' : 'h-24',
                            mediaUrls.length === 3 && idx === 0 && 'row-span-2 h-48'
                          )}
                        >
                          <img
                            src={url}
                            alt={`Media ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-[#71767B] text-xs">
                            <Image className="w-6 h-6 opacity-50" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
