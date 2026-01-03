import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Home, Calendar, Plus, Settings } from 'lucide-react'

interface NavItem {
  icon: typeof Home
  label: string
  path: string
  isAction?: boolean
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Calendar, label: 'Posts', path: '/posts' },
  { icon: Plus, label: 'New', path: '/new', isAction: true },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

export function BottomNav() {
  const location = useLocation()

  // Don't show on editor pages (they have their own back navigation)
  const isEditorPage = location.pathname.startsWith('/new') || location.pathname.startsWith('/edit')
  if (isEditorPage) return null

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/95 backdrop-blur-xl border-t border-border',
        'md:hidden', // Only show on mobile
        'pb-safe' // iOS safe area for home indicator
      )}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          if (item.isAction) {
            // Center "+" button with special styling
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center justify-center',
                  'w-12 h-12 -mt-4 rounded-full',
                  'bg-gradient-to-br from-twitter to-[#0d8bd9]',
                  'text-white shadow-lg',
                  'active:scale-95 transition-transform'
                )}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </Link>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-16 h-full',
                'text-muted-foreground',
                'active:scale-95 transition-all',
                isActive && 'text-twitter'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
              <span className={cn(
                'text-[10px] mt-1 font-medium',
                isActive && 'text-twitter'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-twitter" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
