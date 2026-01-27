'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Hash,
  Palette,
  Download,
  ImagePlus,
  Copy,
  Check,
} from 'lucide-react'
import { Project } from '@/lib/posts'
import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/lib/media'

interface ProjectSidebarProps {
  project: Project
  onInsertHashtag?: (hashtag: string) => void
  onInsertAllHashtags?: (hashtags: string[]) => void
  onInsertLogo?: (logoUrl: string) => void
  className?: string
}

export function ProjectSidebar({
  project,
  onInsertHashtag,
  onInsertAllHashtags,
  onInsertLogo,
  className,
}: ProjectSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const handleCopyColor = async (color: string, label: string) => {
    await navigator.clipboard.writeText(color)
    setCopiedColor(label)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const handleDownloadLogo = () => {
    if (!project.logoUrl) return
    const link = document.createElement('a')
    link.href = getMediaUrl(project.logoUrl)
    link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-logo`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const hasHashtags = project.hashtags.length > 0
  const hasColors = project.brandColors.primary || project.brandColors.secondary || project.brandColors.accent
  const hasLogo = !!project.logoUrl

  if (!hasHashtags && !hasColors && !hasLogo) {
    return null
  }

  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gold))]/10 flex items-center justify-center flex-shrink-0">
          {project.logoUrl ? (
            <img
              src={getMediaUrl(project.logoUrl)}
              alt=""
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <FolderKanban className="w-4 h-4 text-[hsl(var(--gold-dark))]" />
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Project</p>
          <p className="font-medium truncate">{project.name}</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Hashtags */}
          {hasHashtags && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[hsl(var(--gold-dark))]" />
                  <span className="text-sm font-medium">Hashtags</span>
                </div>
                {onInsertAllHashtags && project.hashtags.length > 1 && (
                  <button
                    onClick={() => onInsertAllHashtags(project.hashtags)}
                    className="text-xs text-[hsl(var(--gold-dark))] hover:underline"
                  >
                    Insert all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.hashtags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onInsertHashtag?.(tag)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-sm',
                      'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))]',
                      'hover:bg-[hsl(var(--gold))]/20 transition-colors',
                      onInsertHashtag ? 'cursor-pointer' : 'cursor-default'
                    )}
                    title={onInsertHashtag ? 'Click to insert' : undefined}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brand Colors */}
          {hasColors && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-[hsl(var(--gold-dark))]" />
                <span className="text-sm font-medium">Brand Colors</span>
              </div>
              <div className="space-y-2">
                {project.brandColors.primary && (
                  <button
                    onClick={() => handleCopyColor(project.brandColors.primary!, 'primary')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: project.brandColors.primary }}
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm">Primary</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {project.brandColors.primary}
                      </p>
                    </div>
                    {copiedColor === 'primary' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}
                {project.brandColors.secondary && (
                  <button
                    onClick={() => handleCopyColor(project.brandColors.secondary!, 'secondary')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: project.brandColors.secondary }}
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm">Secondary</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {project.brandColors.secondary}
                      </p>
                    </div>
                    {copiedColor === 'secondary' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}
                {project.brandColors.accent && (
                  <button
                    onClick={() => handleCopyColor(project.brandColors.accent!, 'accent')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: project.brandColors.accent }}
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm">Accent</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {project.brandColors.accent}
                      </p>
                    </div>
                    {copiedColor === 'accent' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Logo */}
          {hasLogo && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderKanban className="w-4 h-4 text-[hsl(var(--gold-dark))]" />
                <span className="text-sm font-medium">Logo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-accent/30 flex items-center justify-center overflow-hidden border border-border">
                  <img
                    src={getMediaUrl(project.logoUrl!)}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {onInsertLogo && (
                    <button
                      onClick={() => onInsertLogo(project.logoUrl!)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold))]/20 transition-colors"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Insert
                    </button>
                  )}
                  <button
                    onClick={handleDownloadLogo}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-border hover:bg-accent transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View project link */}
          <div className="p-4 pt-0">
            <Link
              href={`/projects/${project.id}`}
              className="text-xs text-muted-foreground hover:text-[hsl(var(--gold-dark))] transition-colors"
            >
              View project settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
