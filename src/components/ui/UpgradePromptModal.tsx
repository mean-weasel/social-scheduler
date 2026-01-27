'use client'

import { useEffect, useRef } from 'react'
import { Sparkles, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpgradePromptModalProps {
  open: boolean
  onDismiss: () => void
  title?: string
  description?: string
  currentCount?: number
  limit?: number
}

const PRO_FEATURES = [
  'Unlimited projects',
  'Team collaboration',
  'Advanced analytics',
  'Priority support',
]

export function UpgradePromptModal({
  open,
  onDismiss,
  title = "You've reached the free tier limit",
  description = "You can continue using your existing projects, but you'll need to upgrade to create more.",
  currentCount = 3,
  limit = 3,
}: UpgradePromptModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const dismissButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap and escape key
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    dismissButtonRef.current?.focus()

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onDismiss])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        aria-describedby="upgrade-description"
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-card border border-border rounded-2xl shadow-xl',
          'animate-in zoom-in-95 fade-in duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold))]/10 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-[hsl(var(--gold))]" />
          </div>

          {/* Content */}
          <h2
            id="upgrade-title"
            className="text-lg font-semibold text-foreground mb-2"
          >
            {title}
          </h2>
          <p
            id="upgrade-description"
            className="text-sm text-muted-foreground mb-4"
          >
            {description}
          </p>

          {/* Usage indicator */}
          <div className="mb-6 p-3 rounded-lg bg-accent/50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Projects used</span>
              <span className="font-medium text-foreground">
                {currentCount} / {limit}
              </span>
            </div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--gold))] rounded-full transition-all"
                style={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Pro features */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Upgrade to Pro
            </p>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-[hsl(var(--gold))]" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              ref={dismissButtonRef}
              onClick={onDismiss}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'bg-secondary text-secondary-foreground',
                'font-medium text-sm',
                'hover:bg-accent transition-colors'
              )}
            >
              Maybe Later
            </button>
            <button
              onClick={() => {
                // TODO: Implement upgrade flow
                // For now, just dismiss and show a toast
                onDismiss()
              }}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]',
                'text-black font-medium text-sm',
                'hover:opacity-90 transition-opacity'
              )}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
