import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Clock, Edit2, Plus, FileText, Calendar, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { listPosts } from '@/lib/github'
import { Post, PostStatus, getPostPreviewText, PLATFORM_INFO } from '@/lib/posts'
import { cn } from '@/lib/utils'

type FilterStatus = 'all' | PostStatus

const STATUS_CONFIG: Record<PostStatus, { label: string; icon: typeof FileText; color: string }> = {
  draft: { label: 'Drafts', icon: FileText, color: 'text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Calendar, color: 'text-blue-400' },
  published: { label: 'Published', icon: CheckCircle, color: 'text-green-400' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-destructive' },
}

export function Posts() {
  const { token, config } = useAuth()
  const [filter, setFilter] = useState<FilterStatus>('all')

  const { data: allPosts = [], isLoading } = useQuery({
    queryKey: ['posts', config?.owner, config?.repo],
    queryFn: async () => {
      if (!token || !config) return []
      const [drafts, scheduled, published] = await Promise.all([
        listPosts(token, config, 'drafts'),
        listPosts(token, config, 'scheduled'),
        listPosts(token, config, 'published'),
      ])
      return [...drafts, ...scheduled, ...published]
    },
    enabled: !!token && !!config,
  })

  // Filter posts
  const filteredPosts = filter === 'all' ? allPosts : allPosts.filter((p) => p.status === filter)

  // Sort by most recent first
  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  // Count by status
  const counts = {
    all: allPosts.length,
    draft: allPosts.filter((p) => p.status === 'draft').length,
    scheduled: allPosts.filter((p) => p.status === 'scheduled').length,
    published: allPosts.filter((p) => p.status === 'published').length,
    failed: allPosts.filter((p) => p.status === 'failed').length,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-muted-foreground">Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-semibold mb-1">All Posts</h1>
          <p className="text-muted-foreground">Manage your drafts, scheduled, and published posts.</p>
        </div>
        <Link
          to="/new"
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-primary text-primary-foreground',
            'font-medium text-sm',
            'hover:opacity-90 transition-opacity'
          )}
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl mb-6">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            filter === 'all'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          All <span className="ml-1 text-xs opacity-60">({counts.all})</span>
        </button>
        {(['draft', 'scheduled', 'published', 'failed'] as PostStatus[]).map((status) => {
          const config = STATUS_CONFIG[status]
          const count = counts[status]
          if (status === 'failed' && count === 0) return null
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === status
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <config.icon className={cn('w-4 h-4', filter === status && config.color)} />
              {config.label}
              <span className="text-xs opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Posts list */}
      {sortedPosts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-6">
            {filter === 'all'
              ? "Create your first post to get started."
              : `No ${filter} posts found.`}
          </p>
          <Link
            to="/new"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-primary text-primary-foreground',
              'font-medium text-sm',
              'hover:opacity-90 transition-opacity'
            )}
          >
            <Plus className="w-4 h-4" />
            Create Post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPosts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, index }: { post: Post; index: number }) {
  const statusConfig = STATUS_CONFIG[post.status]
  const StatusIcon = statusConfig.icon

  return (
    <Link
      to={`/edit/${post.id}`}
      className={cn(
        'block p-4 bg-card border border-border rounded-xl',
        'hover:border-primary/30 hover:bg-accent/30 transition-all',
        'animate-slide-up'
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Platform indicators */}
        <div className="flex flex-col gap-1.5 pt-1">
          {post.platforms.map((platform) => (
            <span
              key={platform}
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                platform === 'twitter' && 'bg-twitter shadow-[0_0_8px_rgba(29,161,242,0.4)]',
                platform === 'linkedin' && 'bg-linkedin shadow-[0_0_8px_rgba(10,102,194,0.4)]',
                platform === 'reddit' && 'bg-reddit shadow-[0_0_8px_rgba(255,69,0,0.4)]'
              )}
              title={PLATFORM_INFO[platform].name}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed line-clamp-2 mb-2">
            {getPostPreviewText(post) || <span className="text-muted-foreground italic">No content</span>}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {/* Status */}
            <span className={cn('flex items-center gap-1.5', statusConfig.color)}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>

            {/* Scheduled time */}
            {post.scheduledAt && post.status === 'scheduled' && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(post.scheduledAt), 'MMM d, h:mm a')}
              </span>
            )}

            {/* Published time */}
            {post.status === 'published' && post.publishResults && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {Object.values(post.publishResults).find((r) => r.publishedAt)?.publishedAt
                  ? format(
                      new Date(Object.values(post.publishResults).find((r) => r.publishedAt)!.publishedAt!),
                      'MMM d, h:mm a'
                    )
                  : 'Published'}
              </span>
            )}

            {/* Last updated for drafts */}
            {post.status === 'draft' && (
              <span className="flex items-center gap-1.5">
                Updated {format(new Date(post.updatedAt), 'MMM d')}
              </span>
            )}

            {/* Platforms */}
            <span className="hidden sm:flex items-center gap-1.5">
              {post.platforms.map((p) => PLATFORM_INFO[p].name.split(' ')[0]).join(', ')}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </Link>
  )
}
