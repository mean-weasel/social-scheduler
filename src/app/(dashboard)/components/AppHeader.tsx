'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Settings,
  Plus,
  FolderOpen,
  FileText,
  FolderKanban,
  Rocket,
} from 'lucide-react'
import { UserMenu } from './UserMenu'

interface AppHeaderProps {
  userEmail?: string
  userDisplayName?: string | null
}

export function AppHeader({ userEmail, userDisplayName }: AppHeaderProps) {
  const pathname = usePathname()
  const isEditorPage = pathname?.startsWith('/new') || pathname?.startsWith('/edit') || pathname?.startsWith('/blog/new') || pathname?.startsWith('/blog/edit')

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          {isEditorPage && (
            <Link
              href="/dashboard"
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
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center shadow-lg shadow-[hsl(var(--gold))]/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl md:text-2xl tracking-tight">
              Bullhorn
            </span>
          </Link>
        </div>

        {/* Desktop nav icons - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/projects"
            className={cn(
              'p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors',
              pathname?.startsWith('/projects') && 'bg-accent text-foreground'
            )}
            title="Projects"
          >
            <FolderKanban className="w-5 h-5" />
          </Link>
          <Link
            href="/campaigns"
            className={cn(
              'p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors',
              pathname?.startsWith('/campaigns') && 'bg-accent text-foreground'
            )}
            title="Campaigns"
          >
            <FolderOpen className="w-5 h-5" />
          </Link>
          <Link
            href="/blog"
            className={cn(
              'p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors',
              pathname?.startsWith('/blog') && 'bg-accent text-foreground'
            )}
            title="Blog Drafts"
          >
            <FileText className="w-5 h-5" />
          </Link>
          <Link
            href="/launch-posts"
            className={cn(
              'p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors',
              pathname?.startsWith('/launch-posts') && 'bg-accent text-foreground'
            )}
            title="Launch Posts"
          >
            <Rocket className="w-5 h-5" />
          </Link>
          <Link
            href="/settings"
            className={cn(
              'p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors',
              pathname === '/settings' && 'bg-accent text-foreground'
            )}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
          <div className="ml-2">
            {userEmail ? (
              <UserMenu email={userEmail} displayName={userDisplayName} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center text-xs font-semibold text-white">
                U
              </div>
            )}
          </div>
        </div>
        {/* Mobile user avatar only */}
        <div className="md:hidden">
          {userEmail ? (
            <UserMenu email={userEmail} displayName={userDisplayName} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center text-xs font-semibold text-white">
              U
            </div>
          )}
        </div>
      </div>
      {/* Gold accent line under header */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[hsl(var(--gold))] to-transparent" />
    </header>
  )
}

export function FloatingActionButton() {
  const pathname = usePathname()
  const isEditorPage = pathname?.startsWith('/new') || pathname?.startsWith('/edit') || pathname?.startsWith('/blog/new') || pathname?.startsWith('/blog/edit')

  if (isEditorPage) return null

  return (
    <Link
      href="/new"
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
  )
}
