'use client'

import { cn } from '@/lib/utils'

interface IOSToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  label?: string
  description?: string
  className?: string
  'aria-label'?: string
}

export function IOSToggleSwitch({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  label,
  description,
  className,
  'aria-label': ariaLabel,
}: IOSToggleSwitchProps) {
  const sizeConfig = {
    sm: {
      track: 'w-8 h-5',
      thumb: 'w-3.5 h-3.5',
      thumbOffset: checked ? 'translate-x-3.5' : 'translate-x-0.5',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      thumbOffset: checked ? 'translate-x-5' : 'translate-x-0.5',
    },
    lg: {
      track: 'w-14 h-8',
      thumb: 'w-6 h-6',
      thumbOffset: checked ? 'translate-x-7' : 'translate-x-1',
    },
  }

  const config = sizeConfig[size]

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer rounded-full',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))]/50 focus-visible:ring-offset-2',
        config.track,
        checked
          ? 'bg-[hsl(var(--gold))]'
          : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        !label && !description && className
      )}
    >
      {/* Thumb */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-lg',
          'transform ring-0 transition-transform duration-200 ease-in-out',
          'absolute top-0.5',
          config.thumb,
          config.thumbOffset
        )}
      />
    </button>
  )

  // If no label/description, just return the toggle
  if (!label && !description) {
    return toggle
  }

  // With label/description, wrap in a clickable row
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        'flex items-center justify-between w-full gap-4 text-left',
        'focus:outline-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {label && (
          <p className="font-medium text-sm text-foreground">{label}</p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div
        className={cn(
          'relative inline-flex shrink-0 rounded-full',
          'transition-colors duration-200 ease-in-out',
          config.track,
          checked
            ? 'bg-[hsl(var(--gold))]'
            : 'bg-muted'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-lg',
            'transform ring-0 transition-transform duration-200 ease-in-out',
            'absolute top-0.5',
            config.thumb,
            config.thumbOffset
          )}
        />
      </div>
    </button>
  )
}
