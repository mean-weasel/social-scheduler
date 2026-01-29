'use client'

import { useState, useEffect, useRef } from 'react'
import { FolderKanban } from 'lucide-react'
import { useProjectsStore, useShowUpgradePrompt } from '@/lib/projects'
import { cn } from '@/lib/utils'
import { UpgradePromptModal } from '@/components/ui/UpgradePromptModal'
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogActions,
  ResponsiveDialogButton,
} from '@/components/ui/ResponsiveDialog'

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (projectId: string) => void
}

export function CreateProjectModal({
  open,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { createProject, dismissUpgradePrompt, getProjectCount, atLimit } = useProjectsStore()
  const showUpgradePrompt = useShowUpgradePrompt()
  const isAtLimit = atLimit

  // Focus input on open
  useEffect(() => {
    if (open) {
      setName('')
      setDescription('')
      setError(null)
      // Delay focus to allow animation
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onClose()
      onSuccess?.(project.id)
    } catch (err) {
      setError((err as Error).message || 'Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  const iconWrapper = (
    <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold))]/10 flex items-center justify-center">
      <FolderKanban className="w-6 h-6 text-[hsl(var(--gold-dark))]" />
    </div>
  )

  return (
    <>
      <ResponsiveDialog
        open={open}
        onClose={onClose}
        title="New Project"
        titleId="create-project-title"
        icon={iconWrapper}
      >
        <ResponsiveDialogDescription>
          Create a project to organize campaigns and maintain brand consistency.
        </ResponsiveDialogDescription>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium mb-2">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              ref={inputRef}
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name..."
              className={cn(
                'w-full px-3 py-2.5 rounded-lg',
                'bg-background border border-border',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]',
                'transition-all'
              )}
              required
            />
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm font-medium mb-2">
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this project..."
              rows={3}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg',
                'bg-background border border-border',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]',
                'resize-none transition-all'
              )}
            />
          </div>

          {isAtLimit && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
                You've reached the free tier limit ({getProjectCount()}/3 projects)
              </p>
              <p className="text-amber-600/80 dark:text-amber-400/80 text-xs">
                You can still create this project, but consider upgrading for unlimited projects.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <ResponsiveDialogActions>
            <ResponsiveDialogButton onClick={onClose} variant="secondary">
              Cancel
            </ResponsiveDialogButton>
            <ResponsiveDialogButton
              type="submit"
              variant="primary"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </ResponsiveDialogButton>
          </ResponsiveDialogActions>
        </form>
      </ResponsiveDialog>

      {/* Upgrade prompt modal (shows when at limit after creating) */}
      <UpgradePromptModal
        open={showUpgradePrompt}
        onDismiss={dismissUpgradePrompt}
        currentCount={getProjectCount()}
        limit={3}
      />
    </>
  )
}
