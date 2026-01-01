import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Settings,
  Search,
  Bell,
  Plus,
} from 'lucide-react'

export function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const isEditorPage = location.pathname.startsWith('/new') || location.pathname.startsWith('/edit')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            {isEditorPage && (
              <Link
                to="/"
                className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
            )}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-twitter via-linkedin to-reddit flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-lg tracking-tight">
                Social Scheduler
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <Link
              to="/settings"
              className={cn(
                'p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors',
                location.pathname === '/settings' && 'bg-accent text-foreground'
              )}
            >
              <Settings className="w-5 h-5" />
            </Link>
            <div className="ml-2 w-8 h-8 rounded-full bg-gradient-to-br from-twitter to-linkedin flex items-center justify-center text-xs font-semibold text-white">
              {user?.login?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* FAB for new post */}
      {!isEditorPage && (
        <Link
          to="/new"
          className={cn(
            'fixed bottom-8 right-8 z-50',
            'w-14 h-14 rounded-full',
            'bg-gradient-to-br from-twitter to-[#0d8bd9]',
            'flex items-center justify-center',
            'text-white shadow-lg',
            'hover:scale-110 hover:rotate-90',
            'transition-all duration-300',
            'animate-pulse-glow'
          )}
          title="Create new post"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </Link>
      )}
    </div>
  )
}
