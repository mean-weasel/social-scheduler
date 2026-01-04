import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, CalendarPlus } from 'lucide-react'
import { usePostsStore } from '@/lib/storage'
import { Post, getPostPreviewText } from '@/lib/posts'
import { cn } from '@/lib/utils'

export function Dashboard() {
  const allPosts = usePostsStore((state) => state.posts)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filter posts for current month view
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad the start of the month to align with Sunday
  const startPadding = monthStart.getDay()
  const paddedDays = Array(startPadding).fill(null).concat(calendarDays)

  // Group posts by date
  const postsByDate = allPosts.reduce((acc, post) => {
    if (post.scheduledAt) {
      const date = format(new Date(post.scheduledAt), 'yyyy-MM-dd')
      if (!acc[date]) acc[date] = []
      acc[date].push(post)
    }
    return acc
  }, {} as Record<string, Post[]>)

  // Upcoming posts (next 5 scheduled)
  const upcomingPosts = allPosts
    .filter((p) => p.status === 'scheduled' && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5)

  // Stats
  const stats = {
    scheduled: allPosts.filter((p) => p.status === 'scheduled').length,
    drafts: allPosts.filter((p) => p.status === 'draft').length,
    published: allPosts.filter((p) => p.status === 'published').length,
  }

  const navigateMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + delta)
      return next
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] min-h-[calc(100vh-4rem)]">
      {/* Calendar */}
      <div className="p-4 md:p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden animate-fade-in">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="text-base md:text-lg font-medium font-display">
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
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2 md:px-3 py-1.5 text-xs font-medium rounded hover:bg-accent transition-colors"
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

          {/* Mobile stats bar */}
          <div className="flex lg:hidden border-b border-border">
            <div className="flex-1 py-2 text-center border-r border-border">
              <div className="text-lg font-semibold">{stats.scheduled}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Scheduled</div>
            </div>
            <div className="flex-1 py-2 text-center border-r border-border">
              <div className="text-lg font-semibold">{stats.drafts}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Drafts</div>
            </div>
            <div className="flex-1 py-2 text-center">
              <div className="text-lg font-semibold">{stats.published}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Published</div>
            </div>
          </div>

          {/* Scrollable calendar container for mobile */}
          <div className="overflow-x-auto scroll-snap-x">
            <div className="min-w-[560px]">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="py-2 md:py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground scroll-snap-start"
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

              return (
                <Link
                  key={dateKey}
                  to={`/new?date=${dateKey}`}
                  className={cn(
                    'min-h-[80px] md:min-h-[100px] p-1.5 md:p-2 border-r border-b border-border',
                    'flex flex-col gap-1 cursor-pointer transition-colors',
                    'hover:bg-accent/50',
                    !isCurrentMonth && 'opacity-30',
                    isCurrentDay && 'bg-accent/30'
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium text-muted-foreground',
                      isCurrentDay &&
                        'w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center'
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
                          post.platforms[0] === 'twitter' && 'bg-twitter-soft text-twitter',
                          post.platforms[0] === 'linkedin' && 'bg-linkedin-soft text-linkedin',
                          post.platforms[0] === 'reddit' && 'bg-reddit-soft text-reddit'
                        )}
                        onClick={(e) => {
                          e.preventDefault()
                          window.location.href = `/edit/${post.id}`
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {getPostPreviewText(post).slice(0, 20)}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayPosts.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - hidden on mobile */}
      <aside className="hidden lg:block border-l border-border bg-card p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Scheduled', value: stats.scheduled },
            { label: 'Drafts', value: stats.drafts },
            { label: 'Published', value: stats.published },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-background border border-border rounded-lg p-3 text-center"
            >
              <div className="text-xl font-display font-semibold">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming posts */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming Posts
          </h3>
          <Link
            to="/posts"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {upcomingPosts.length === 0 ? (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-twitter/10 to-linkedin/10 flex items-center justify-center">
                <CalendarPlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No posts scheduled</p>
              <p className="text-xs text-muted-foreground mb-4">
                Click any date on the calendar to schedule a post
              </p>
              <Link
                to="/new"
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                  'bg-primary/10 text-primary text-sm font-medium',
                  'hover:bg-primary/20 transition-colors'
                )}
              >
                <CalendarPlus className="w-4 h-4" />
                Schedule a Post
              </Link>
            </div>
          ) : (
            upcomingPosts.map((post, i) => (
              <Link
                key={post.id}
                to={`/edit/${post.id}`}
                className={cn(
                  'flex gap-3 p-3 rounded-lg border border-border bg-background',
                  'hover:border-border hover:bg-accent/50 transition-all',
                  'hover:translate-x-1',
                  'animate-slide-up'
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-col gap-1 pt-0.5">
                  {post.platforms.map((platform) => (
                    <span
                      key={platform}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        platform === 'twitter' && 'bg-twitter shadow-[0_0_8px_rgba(29,161,242,0.5)]',
                        platform === 'linkedin' && 'bg-linkedin shadow-[0_0_8px_rgba(10,102,194,0.5)]',
                        platform === 'reddit' && 'bg-reddit shadow-[0_0_8px_rgba(255,69,0,0.5)]'
                      )}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{getPostPreviewText(post)}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {post.scheduledAt && format(new Date(post.scheduledAt), 'MMM d, h:mm a')}
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
                        'bg-blue-500/10 text-blue-400'
                      )}
                    >
                      Scheduled
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
