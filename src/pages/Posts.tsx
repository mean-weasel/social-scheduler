import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns'
import {
  Clock,
  Edit2,
  Plus,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Archive,
  List,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Search,
  X,
} from 'lucide-react'
import { usePostsStore } from '@/lib/storage'
import { Post, PostStatus, getPostPreviewText, PLATFORM_INFO } from '@/lib/posts'
import { cn } from '@/lib/utils'

type FilterStatus = 'all' | PostStatus
type ViewMode = 'list' | 'calendar'

const STATUS_CONFIG: Record<PostStatus, { label: string; icon: typeof FileText; color: string }> = {
  draft: { label: 'Drafts', icon: FileText, color: 'text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Calendar, color: 'text-blue-400' },
  published: { label: 'Published', icon: CheckCircle, color: 'text-green-400' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-destructive' },
  archived: { label: 'Archived', icon: Archive, color: 'text-muted-foreground' },
}

export function Posts() {
  const allPosts = usePostsStore((state) => state.posts)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')

  // Filter posts - 'all' excludes archived posts
  const statusFilteredPosts =
    filter === 'all'
      ? allPosts.filter((p) => p.status !== 'archived')
      : allPosts.filter((p) => p.status === filter)

  // Apply search filter
  const filteredPosts = searchQuery.trim()
    ? statusFilteredPosts.filter((p) => {
        const query = searchQuery.toLowerCase()
        const content = getPostPreviewText(p).toLowerCase()
        const notes = (p.notes || '').toLowerCase()
        return content.includes(query) || notes.includes(query)
      })
    : statusFilteredPosts

  // Sort by most recent first
  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  // Count by status - 'all' count excludes archived
  const counts = {
    all: allPosts.filter((p) => p.status !== 'archived').length,
    draft: allPosts.filter((p) => p.status === 'draft').length,
    scheduled: allPosts.filter((p) => p.status === 'scheduled').length,
    published: allPosts.filter((p) => p.status === 'published').length,
    failed: allPosts.filter((p) => p.status === 'failed').length,
    archived: allPosts.filter((p) => p.status === 'archived').length,
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 tracking-tight">All Posts</h1>
          <p className="text-sm md:text-base text-muted-foreground hidden sm:block">
            Manage your drafts, scheduled, and published posts.
          </p>
          <div className="h-1 w-16 bg-gradient-to-r from-[hsl(var(--gold))] to-transparent mt-2 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex p-1 bg-card border border-border rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold-dark))]'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'calendar'
                  ? 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold-dark))]'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Calendar view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Link
            to="/new"
            className={cn(
              'flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-lg min-h-[44px]',
              'bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]',
              'text-white font-medium text-sm',
              'hover:shadow-lg hover:shadow-[hsl(var(--gold))]/30 transition-all'
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Post</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Search bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search posts by content or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-10 py-2.5 rounded-lg',
                  'bg-card border border-border',
                  'text-sm placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]',
                  'transition-all'
                )}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-2">
                Found {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Filter tabs - horizontally scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 mb-4 md:mb-6">
            <div className="flex gap-1 p-1 bg-card border border-border rounded-xl min-w-max md:min-w-0">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'flex-1 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[40px]',
                  filter === 'all'
                    ? 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold-dark))]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                All <span className="ml-1 text-xs opacity-60">({counts.all})</span>
              </button>
              {(['draft', 'scheduled', 'published', 'failed', 'archived'] as PostStatus[]).map((status) => {
                const config = STATUS_CONFIG[status]
                const count = counts[status]
                // Hide failed and archived tabs when empty
                if ((status === 'failed' || status === 'archived') && count === 0) return null
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[40px]',
                      filter === status
                        ? 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold-dark))]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <config.icon className={cn('w-4 h-4', filter === status && config.color)} />
                    <span className="hidden sm:inline">{config.label}</span>
                    <span className="text-xs opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Posts list */}
          {sortedPosts.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-card border border-border rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[hsl(var(--gold))]/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-[hsl(var(--gold-dark))]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'all' ? 'No posts yet' : `No ${filter} posts`}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto px-4">
                {filter === 'all'
                  ? 'Start creating content for Twitter, LinkedIn, and Reddit.'
                  : filter === 'draft'
                    ? 'All your drafts have been published or scheduled.'
                    : filter === 'scheduled'
                      ? 'No posts scheduled right now.'
                      : filter === 'published'
                        ? "You haven't published any posts yet."
                        : filter === 'archived'
                          ? 'No archived posts.'
                          : 'No failed posts.'}
              </p>
              <Link
                to="/new"
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3 rounded-xl',
                  'bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]',
                  'text-white font-medium text-sm',
                  'hover:shadow-lg hover:shadow-[hsl(var(--gold))]/30 transition-all'
                )}
              >
                <Plus className="w-4 h-4" />
                Create Your First Post
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </div>
          )}
        </>
      ) : (
        <CalendarView
          posts={allPosts.filter((p) => p.status !== 'archived')}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
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
        'block p-3 md:p-4 bg-card border border-border rounded-xl',
        'hover:border-[hsl(var(--gold))]/50 hover:shadow-md transition-all',
        'active:scale-[0.99]',
        'animate-slide-up'
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start gap-3 md:gap-4">
        {/* Platform indicator */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              post.platform === 'twitter' && 'bg-twitter shadow-[0_0_8px_rgba(29,161,242,0.4)]',
              post.platform === 'linkedin' && 'bg-linkedin shadow-[0_0_8px_rgba(10,102,194,0.4)]',
              post.platform === 'reddit' && 'bg-reddit shadow-[0_0_8px_rgba(255,69,0,0.4)]'
            )}
            title={PLATFORM_INFO[post.platform].name}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed line-clamp-2 mb-2">
            {getPostPreviewText(post) || <span className="text-muted-foreground italic">No content</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-muted-foreground">
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
            {post.status === 'published' && post.publishResult && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {post.publishResult.publishedAt
                  ? format(new Date(post.publishResult.publishedAt), 'MMM d, h:mm a')
                  : 'Published'}
              </span>
            )}

            {/* Last updated for drafts */}
            {post.status === 'draft' && (
              <span className="flex items-center gap-1.5">
                Updated {format(new Date(post.updatedAt), 'MMM d')}
              </span>
            )}

            {/* Platform */}
            <span className="hidden sm:flex items-center gap-1.5">
              {PLATFORM_INFO[post.platform].name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </Link>
  )
}

function CalendarView({
  posts,
  currentDate,
  onDateChange,
}: {
  posts: Post[]
  currentDate: Date
  onDateChange: (date: Date) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const startPadding = monthStart.getDay()
  const paddedDays = Array(startPadding).fill(null).concat(calendarDays)

  // Group posts by date
  const postsByDate = posts.reduce((acc, post) => {
    if (post.scheduledAt) {
      const date = format(new Date(post.scheduledAt), 'yyyy-MM-dd')
      if (!acc[date]) acc[date] = []
      acc[date].push(post)
    }
    return acc
  }, {} as Record<string, Post[]>)

  const navigateMonth = (delta: number) => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + delta)
    onDateChange(next)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-[hsl(var(--gold))]">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold font-display tracking-tight text-[hsl(var(--gold-dark))]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDateChange(new Date())}
              className="px-3 py-1.5 text-xs font-medium rounded hover:bg-accent transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable calendar container */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b-2 border-[hsl(var(--gold))]/20 bg-[hsl(var(--gold))]/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--gold-dark))]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {paddedDays.map((day, i) => {
              if (!day) {
                return <div key={`pad-${i}`} className="aspect-square border-r border-b border-border opacity-30" />
              }

              const dateKey = format(day, 'yyyy-MM-dd')
              const dayPosts = postsByDate[dateKey] || []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)
              const isPastDate = isBefore(startOfDay(day), startOfDay(new Date())) && !isCurrentDay

              const cellClassName = cn(
                'min-h-[80px] md:min-h-[100px] p-1.5 md:p-2 border-r border-b border-border',
                'flex flex-col gap-1 transition-colors',
                !isPastDate && 'cursor-pointer hover:bg-accent/50',
                isPastDate && 'cursor-default',
                !isCurrentMonth && 'opacity-30',
                isCurrentDay && 'bg-[hsl(var(--gold))]/10'
              )

              const cellContent = (
                <>
                  <span
                    className={cn(
                      'text-sm font-medium text-muted-foreground',
                      isCurrentDay &&
                        'w-6 h-6 rounded-full bg-[hsl(var(--gold))] text-white flex items-center justify-center'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-auto">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className={cn(
                          'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate',
                          post.platform === 'twitter' && 'bg-twitter/10 text-twitter',
                          post.platform === 'linkedin' && 'bg-linkedin/10 text-linkedin',
                          post.platform === 'reddit' && 'bg-reddit/10 text-reddit'
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.location.href = `/edit/${post.id}`
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {getPostPreviewText(post).slice(0, 20)}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} more</span>
                    )}
                  </div>
                </>
              )

              // For past dates, render a div instead of a Link
              if (isPastDate) {
                return (
                  <div key={dateKey} className={cellClassName}>
                    {cellContent}
                  </div>
                )
              }

              return (
                <Link key={dateKey} to={`/new?date=${dateKey}`} className={cellClassName}>
                  {cellContent}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
