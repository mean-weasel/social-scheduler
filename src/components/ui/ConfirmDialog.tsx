import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus trap and escape key
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    confirmButtonRef.current?.focus()

    // Prevent body scroll
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className={cn(
          'relative z-10 w-full max-w-md',
          'bg-card border border-border rounded-2xl shadow-xl',
          'animate-in zoom-in-95 fade-in duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center mb-4',
              variant === 'danger' && 'bg-destructive/10',
              variant === 'warning' && 'bg-yellow-500/10',
              variant === 'default' && 'bg-primary/10'
            )}
          >
            <AlertTriangle
              className={cn(
                'w-6 h-6',
                variant === 'danger' && 'text-destructive',
                variant === 'warning' && 'text-yellow-500',
                variant === 'default' && 'text-primary'
              )}
            />
          </div>

          {/* Content */}
          <h2
            id="confirm-title"
            className="text-lg font-semibold text-foreground mb-2"
          >
            {title}
          </h2>
          <p
            id="confirm-description"
            className="text-sm text-muted-foreground mb-6"
          >
            {description}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'bg-secondary text-secondary-foreground',
                'font-medium text-sm',
                'hover:bg-accent transition-colors'
              )}
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'font-medium text-sm',
                'transition-colors',
                variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                variant === 'warning' && 'bg-yellow-500 text-white hover:bg-yellow-600',
                variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
