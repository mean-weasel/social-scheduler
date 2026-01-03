import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Settings,
  Search,
  Bell,
  Plus,
  Github,
  X,
} from 'lucide-react'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const { user, isDemoMode, exitDemoMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isEditorPage = location.pathname.startsWith('/new') || location.pathname.startsWith('/edit')

  const handleExitDemo = () => {
    exitDemoMode()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center justify-between px-6 py-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-amber-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Demo Mode
              </span>
              <span className="text-sm text-muted-foreground">
                You're exploring with sample data. Sign in with GitHub to use your own posts.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExitDemo}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                  'bg-[#24292f] text-white text-sm font-medium',
                  'hover:bg-[#24292f]/80 transition-colors'
                )}
              >
                <Github className="w-4 h-4" />
                Sign in with GitHub
              </button>
              <button
                onClick={handleExitDemo}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Exit demo mode"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Desktop nav icons - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
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
          {/* Mobile user avatar only */}
          <div className="md:hidden w-8 h-8 rounded-full bg-gradient-to-br from-twitter to-linkedin flex items-center justify-center text-xs font-semibold text-white">
            {user?.login?.slice(0, 2).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      {/* Main content - bottom padding for mobile nav */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* FAB for new post - hidden on mobile (replaced by bottom nav) */}
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
            'animate-pulse-glow',
            'hidden md:flex' // Hide on mobile
          )}
          title="Create new post"
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </Link>
      )}

      {/* Bottom navigation for mobile */}
      <BottomNav />
    </div>
  )
}
