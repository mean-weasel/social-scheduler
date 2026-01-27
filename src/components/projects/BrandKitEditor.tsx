'use client'

import { useState, useRef } from 'react'
import { Upload, X, Download, Hash, Palette, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Project } from '@/lib/posts'
import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/lib/media'

interface BrandKitEditorProps {
  project: Project
  onUpdate: (updates: Partial<Project>) => Promise<void>
  onLogoUpload?: (file: File) => Promise<string | null>
  onLogoDelete?: () => Promise<void>
}

export function BrandKitEditor({
  project,
  onUpdate,
  onLogoUpload,
  onLogoDelete,
}: BrandKitEditorProps) {
  // Hashtags state
  const [hashtags, setHashtags] = useState<string[]>(project.hashtags)
  const [newHashtag, setNewHashtag] = useState('')

  // Brand colors state
  const [primaryColor, setPrimaryColor] = useState(project.brandColors.primary || '')
  const [secondaryColor, setSecondaryColor] = useState(project.brandColors.secondary || '')
  const [accentColor, setAccentColor] = useState(project.brandColors.accent || '')

  // Logo state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Saving state
  const [saving, setSaving] = useState(false)

  const handleAddHashtag = () => {
    const tag = newHashtag.trim().replace(/^#/, '')
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag])
      setNewHashtag('')
    }
  }

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddHashtag()
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onLogoUpload) return

    setUploading(true)
    setUploadError(null)

    try {
      await onLogoUpload(file)
    } catch (err) {
      setUploadError((err as Error).message || 'Failed to upload logo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleLogoDelete = async () => {
    if (!onLogoDelete) return
    if (!confirm('Remove the project logo?')) return

    setUploading(true)
    try {
      await onLogoDelete()
    } catch (err) {
      setUploadError((err as Error).message || 'Failed to remove logo')
    } finally {
      setUploading(false)
    }
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

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate({
        hashtags,
        brandColors: {
          primary: primaryColor || undefined,
          secondary: secondaryColor || undefined,
          accent: accentColor || undefined,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    JSON.stringify(hashtags) !== JSON.stringify(project.hashtags) ||
    primaryColor !== (project.brandColors.primary || '') ||
    secondaryColor !== (project.brandColors.secondary || '') ||
    accentColor !== (project.brandColors.accent || '')

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-[hsl(var(--gold-dark))]" />
          <h3 className="font-semibold">Logo</h3>
        </div>

        <div className="flex items-start gap-4">
          {/* Logo preview */}
          <div className="w-24 h-24 rounded-xl bg-accent/30 flex items-center justify-center overflow-hidden border border-border">
            {project.logoUrl ? (
              <img
                src={getMediaUrl(project.logoUrl)}
                alt="Project logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload a logo for your project. Supported formats: PNG, JPG, SVG, WebP. Max 5MB.
            </p>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                  'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))]',
                  'hover:bg-[hsl(var(--gold))]/20 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {project.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </button>

              {project.logoUrl && (
                <>
                  <button
                    onClick={handleDownloadLogo}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handleLogoDelete}
                    disabled={uploading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </>
              )}
            </div>

            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hashtags Section */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-5 h-5 text-[hsl(var(--gold-dark))]" />
          <h3 className="font-semibold">Hashtags</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Add hashtags that will be available for quick insertion when creating posts.
        </p>

        {/* Hashtag input */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">#</span>
            <input
              type="text"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value.replace(/^#/, ''))}
              onKeyDown={handleKeyDown}
              placeholder="Add hashtag"
              className={cn(
                'w-full pl-7 pr-3 py-2.5 rounded-lg',
                'bg-background border border-border',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50 focus:border-[hsl(var(--gold))]'
              )}
            />
          </div>
          <button
            onClick={handleAddHashtag}
            disabled={!newHashtag.trim()}
            className={cn(
              'px-4 py-2.5 rounded-lg text-sm font-medium',
              'bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))]',
              'hover:bg-[hsl(var(--gold))]/20 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Add
          </button>
        </div>

        {/* Hashtag chips */}
        {hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold-dark))] text-sm"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveHashtag(tag)}
                  className="p-0.5 rounded-full hover:bg-[hsl(var(--gold))]/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No hashtags added yet</p>
        )}
      </div>

      {/* Brand Colors Section */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-[hsl(var(--gold-dark))]" />
          <h3 className="font-semibold">Brand Colors</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Set your brand colors for reference when creating content.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Primary color */}
          <div>
            <label className="block text-sm font-medium mb-2">Primary</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor || '#000000'}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#000000"
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded-lg',
                  'bg-background border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50'
                )}
              />
            </div>
          </div>

          {/* Secondary color */}
          <div>
            <label className="block text-sm font-medium mb-2">Secondary</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor || '#000000'}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                placeholder="#000000"
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded-lg',
                  'bg-background border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50'
                )}
              />
            </div>
          </div>

          {/* Accent color */}
          <div>
            <label className="block text-sm font-medium mb-2">Accent</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor || '#000000'}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#000000"
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded-lg',
                  'bg-background border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))]/50'
                )}
              />
            </div>
          </div>
        </div>

        {/* Color preview */}
        {(primaryColor || secondaryColor || accentColor) && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <div className="flex gap-2">
              {primaryColor && (
                <div
                  className="w-12 h-12 rounded-lg border border-border shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                  title={`Primary: ${primaryColor}`}
                />
              )}
              {secondaryColor && (
                <div
                  className="w-12 h-12 rounded-lg border border-border shadow-sm"
                  style={{ backgroundColor: secondaryColor }}
                  title={`Secondary: ${secondaryColor}`}
                />
              )}
              {accentColor && (
                <div
                  className="w-12 h-12 rounded-lg border border-border shadow-sm"
                  style={{ backgroundColor: accentColor }}
                  title={`Accent: ${accentColor}`}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      {hasChanges && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium',
              'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))]',
              'text-black hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      )}
    </div>
  )
}
