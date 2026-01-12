'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/profile'
import { createClient } from '@/lib/supabase/client'

interface UserMenuProps {
  email: string
  displayName?: string | null
}

export function UserMenu({ email, displayName }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const initials = getInitials(displayName, email)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white',
          'bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]',
          'hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50'
        )}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {initials}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-56 py-2',
            'bg-card rounded-xl border border-border shadow-lg',
            'animate-slide-up z-50'
          )}
        >
          {/* User info */}
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium truncate">
              {displayName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm',
                'text-foreground hover:bg-accent transition-colors'
              )}
            >
              <User className="w-4 h-4" />
              Profile
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm w-full text-left',
                'text-destructive hover:bg-destructive/10 transition-colors',
                isLoggingOut && 'opacity-50 cursor-not-allowed'
              )}
            >
              <LogOut className="w-4 h-4" />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
