'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SegmentOption<T extends string = string> {
  value: T
  label: string
  icon?: ReactNode
  count?: number
  hidden?: boolean
}

interface IOSSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  showCounts?: boolean
  showLabelsOnMobile?: boolean
  className?: string
  disabled?: boolean
}

export function IOSSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  showCounts = true,
  showLabelsOnMobile = false,
  className,
  disabled = false,
}: IOSSegmentedControlProps<T>) {
  const visibleOptions = options.filter((opt) => !opt.hidden)

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  }

  const paddingClasses = {
    sm: 'px-2 md:px-3',
    md: 'px-3 md:px-4',
    lg: 'px-4 md:px-5',
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div
      role="tablist"
      aria-label="Filter options"
      className={cn(
        'inline-flex gap-1 p-1 bg-card border border-border rounded-xl',
        fullWidth && 'w-full',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {visibleOptions.map((option) => {
        const isActive = value === option.value

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'relative flex items-center justify-center gap-1.5',
              'rounded-lg font-medium transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))]/50',
              sizeClasses[size],
              paddingClasses[size],
              fullWidth && 'flex-1',
              isActive
                ? 'bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold-dark))] shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            {/* Icon */}
            {option.icon && (
              <span className={cn(iconSizeClasses[size], 'flex-shrink-0')}>
                {option.icon}
              </span>
            )}

            {/* Label */}
            <span
              className={cn(
                'whitespace-nowrap',
                !showLabelsOnMobile && option.icon && 'hidden sm:inline'
              )}
            >
              {option.label}
            </span>

            {/* Count badge */}
            {showCounts && option.count !== undefined && (
              <span
                className={cn(
                  'opacity-60',
                  size === 'sm' ? 'text-[10px]' : 'text-xs'
                )}
              >
                ({option.count})
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
