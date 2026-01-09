'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Calendar, Plus, Settings, FileText } from 'lucide-react'

interface NavItem {
  icon: typeof Home
  label: string
  path: string
  isAction?: boolean
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Calendar, label: 'Posts', path: '/posts' },
  { icon: Plus, label: 'New', path: '/new', isAction: true },
  { icon: FileText, label: 'Blog', path: '/blog' },
  { icon: Settings, label: 'More', path: '/settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  // Don't show on editor pages (they have their own back navigation)
  const isEditorPage = pathname?.startsWith('/new') || pathname?.startsWith('/edit') || pathname?.startsWith('/blog/new') || pathname?.startsWith('/blog/edit')
  if (isEditorPage) return null

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card/95 backdrop-blur-xl',
        'md:hidden', // Only show on mobile
        'pb-safe' // iOS safe area for home indicator
      )}
    >
      {/* Gold accent line at top */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold))] to-transparent" />
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/')
          const Icon = item.icon

          if (item.isAction) {
            // Center "+" button with gold styling
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center justify-center',
                  'w-14 h-14 -mt-6 rounded-full',
                  'bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]',
                  'text-white shadow-lg shadow-[hsl(var(--gold))]/40',
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
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center',
                'flex-1 h-full max-w-[72px]',
                'text-muted-foreground',
                'active:scale-95 transition-all',
                isActive && 'text-[hsl(var(--gold-dark))]'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
              <span className={cn(
                'text-[10px] mt-1 font-semibold uppercase',
                isActive && 'text-[hsl(var(--gold-dark))]'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-4 h-0.5 rounded-full bg-[hsl(var(--gold))]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
