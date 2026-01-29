'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogActions,
  ResponsiveDialogButton,
} from './ResponsiveDialog'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  children?: ReactNode
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
  children,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => confirmButtonRef.current?.focus(), 100)
    }
  }, [open])

  const iconWrapper = (
    <div
      className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center',
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
  )

  return (
    <ResponsiveDialog
      open={open}
      onClose={onCancel}
      title={title}
      titleId="confirm-title"
      descriptionId="confirm-description"
      icon={iconWrapper}
      role="alertdialog"
    >
      <ResponsiveDialogDescription id="confirm-description">
        {description}
      </ResponsiveDialogDescription>

      {/* Additional content */}
      {children && <div className="mb-4">{children}</div>}

      {/* Actions */}
      <ResponsiveDialogActions>
        <ResponsiveDialogButton onClick={onCancel} variant="secondary">
          {cancelText}
        </ResponsiveDialogButton>
        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          className={cn(
            'flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors',
            'md:py-2.5 py-3.5 min-h-[48px] md:min-h-0',
            variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            variant === 'warning' && 'bg-yellow-500 text-white hover:bg-yellow-600',
            variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {confirmText}
        </button>
      </ResponsiveDialogActions>
    </ResponsiveDialog>
  )
}
