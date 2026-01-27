'use client'

import { useState, useEffect } from 'react'
import { Loader2, FolderKanban, Check, ArrowRight } from 'lucide-react'
import { useProjectsStore } from '@/lib/projects'
import { useCampaignsStore } from '@/lib/campaigns'
import { Campaign } from '@/lib/posts'
import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/lib/media'

interface MoveCampaignModalProps {
  campaign: Campaign
  onClose: () => void
  onMoved?: () => void
}

export function MoveCampaignModal({ campaign, onClose, onMoved }: MoveCampaignModalProps) {
  const { projects, fetchProjects, initialized } = useProjectsStore()
  const { moveCampaignToProject } = useCampaignsStore()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(campaign.projectId || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialized) {
      fetchProjects()
    }
  }, [initialized, fetchProjects])

  const handleMove = async () => {
    // No change if same project
    if (selectedProjectId === (campaign.projectId || null)) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      await moveCampaignToProject(campaign.id, selectedProjectId)
      onMoved?.()
      onClose()
    } catch (err) {
      setError((err as Error).message || 'Failed to move campaign')
    } finally {
      setSaving(false)
    }
  }

  const currentProject = campaign.projectId
    ? projects.find(p => p.id === campaign.projectId)
    : null

  const selectedProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md animate-scale-in max-h-[90vh] flex flex-col">
        <div className="p-4 md:p-6 overflow-y-auto">
          <h2 className="text-lg md:text-xl font-display font-bold mb-2">Move Campaign</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Move "{campaign.name}" to a different project.
          </p>

          {/* Current location */}
          <div className="mb-4 p-3 bg-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Currently in:</p>
            <div className="flex items-center gap-2">
              {currentProject?.logoUrl ? (
                <img
                  src={getMediaUrl(currentProject.logoUrl)}
                  alt=""
                  className="w-5 h-5 rounded object-contain"
                />
              ) : (
                <FolderKanban className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="font-medium">
                {currentProject?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Project options */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {/* Unassigned option */}
            <button
              onClick={() => setSelectedProjectId(null)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                selectedProjectId === null
                  ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5'
                  : 'border-border hover:border-[hsl(var(--gold))]/50'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FolderKanban className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">Unassigned</p>
                <p className="text-xs text-muted-foreground">
                  Not part of any project
                </p>
              </div>
              {selectedProjectId === null && (
                <Check className="w-5 h-5 text-[hsl(var(--gold-dark))]" />
              )}
            </button>

            {/* Project options */}
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                  selectedProjectId === project.id
                    ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5'
                    : 'border-border hover:border-[hsl(var(--gold))]/50'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gold))]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {project.logoUrl ? (
                    <img
                      src={getMediaUrl(project.logoUrl)}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FolderKanban className="w-4 h-4 text-[hsl(var(--gold-dark))]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {project.description}
                    </p>
                  )}
                </div>
                {selectedProjectId === project.id && (
                  <Check className="w-5 h-5 text-[hsl(var(--gold-dark))]" />
                )}
              </button>
            ))}
          </div>

          {/* Move preview */}
          {selectedProjectId !== (campaign.projectId || null) && (
            <div className="mt-4 p-3 bg-[hsl(var(--gold))]/5 border border-[hsl(var(--gold))]/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {currentProject?.name || 'Unassigned'}
                </span>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--gold-dark))]" />
                <span className="font-medium text-[hsl(var(--gold-dark))]">
                  {selectedProject?.name || 'Unassigned'}
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-3 sm:py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={saving || selectedProjectId === (campaign.projectId || null)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]',
                'bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]',
                'text-white',
                'hover:shadow-lg hover:shadow-[hsl(var(--gold))]/30',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Move Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
