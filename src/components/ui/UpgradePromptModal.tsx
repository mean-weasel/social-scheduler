'use client'

import { useEffect, useRef } from 'react'
import { Sparkles, Check } from 'lucide-react'
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogActions,
  ResponsiveDialogButton,
} from './ResponsiveDialog'

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
  const dismissButtonRef = useRef<HTMLButtonElement>(null)

  // Focus dismiss button when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => dismissButtonRef.current?.focus(), 100)
    }
  }, [open])

  const iconWrapper = (
    <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold))]/10 flex items-center justify-center">
      <Sparkles className="w-6 h-6 text-[hsl(var(--gold))]" />
    </div>
  )

  return (
    <ResponsiveDialog
      open={open}
      onClose={onDismiss}
      title={title}
      titleId="upgrade-title"
      descriptionId="upgrade-description"
      icon={iconWrapper}
    >
      <ResponsiveDialogDescription id="upgrade-description">
        {description}
      </ResponsiveDialogDescription>

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
      <ResponsiveDialogActions>
        <button
          ref={dismissButtonRef}
          onClick={onDismiss}
          className="flex-1 px-4 py-2.5 md:py-2.5 py-3.5 min-h-[48px] md:min-h-0 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-accent transition-colors"
        >
          Maybe Later
        </button>
        <ResponsiveDialogButton
          onClick={() => {
            // TODO: Implement upgrade flow
            onDismiss()
          }}
          variant="primary"
        >
          Upgrade Now
        </ResponsiveDialogButton>
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  )
}
