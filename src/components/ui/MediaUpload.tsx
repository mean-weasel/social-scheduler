import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Upload, X, Image as ImageIcon, Film, AlertCircle } from 'lucide-react'
import { UploadProgress } from './UploadProgress'
import {
  uploadMedia,
  deleteMedia,
  getMediaUrl,
  validateFile,
  ACCEPT_MEDIA,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  type UploadProgress as UploadProgressType,
} from '@/lib/media'

interface MediaUploadProps {
  platform: 'twitter' | 'linkedin'
  maxFiles: number // 4 for Twitter, 1 for LinkedIn
  existingMedia: string[]
  onMediaChange: (media: string[]) => void
  disabled?: boolean
  className?: string
}

export function MediaUpload({
  platform,
  maxFiles,
  existingMedia,
  onMediaChange,
  disabled = false,
  className,
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType | null>(null)
  const [uploadFilename, setUploadFilename] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = existingMedia.length < maxFiles && !uploading && !disabled

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canAddMore) {
      setIsDragging(true)
    }
  }, [canAddMore])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null)

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setUploading(true)
    setUploadFilename(file.name)
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 })

    const result = await uploadMedia(file, (progress) => {
      setUploadProgress(progress)
    })

    setUploading(false)
    setUploadProgress(null)
    setUploadFilename(null)

    if (result.success && result.filename) {
      onMediaChange([...existingMedia, result.filename])
    } else {
      setError(result.error || 'Upload failed')
    }
  }, [existingMedia, onMediaChange])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (!canAddMore) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        await handleFileUpload(files[0])
      }
    },
    [canAddMore, handleFileUpload]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        await handleFileUpload(files[0])
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [handleFileUpload]
  )

  const handleRemove = async (index: number) => {
    const filename = existingMedia[index]
    // Optimistically remove from UI
    const newMedia = existingMedia.filter((_, i) => i !== index)
    onMediaChange(newMedia)

    // Try to delete from server (don't block on this)
    deleteMedia(filename).catch(() => {
      // Ignore delete errors - file might already be gone
    })
  }

  const handleDropZoneClick = () => {
    if (canAddMore) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-destructive/20 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Existing media previews */}
      {existingMedia.length > 0 && (
        <div
          className={cn(
            'grid gap-2',
            maxFiles === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2'
          )}
        >
          {existingMedia.map((filename, idx) => (
            <MediaPreviewItem
              key={filename}
              filename={filename}
              index={idx}
              onRemove={() => handleRemove(idx)}
            />
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploading && uploadProgress && (
        <UploadProgress
          progress={uploadProgress.percentage}
          filename={uploadFilename || undefined}
        />
      )}

      {/* Drop zone / upload button */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
            isDragging
              ? platform === 'twitter'
                ? 'border-twitter bg-twitter/5'
                : 'border-linkedin bg-linkedin/5'
              : 'border-border hover:border-muted-foreground/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_MEDIA}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <Upload
            className={cn(
              'w-8 h-8 mx-auto mb-2',
              isDragging
                ? platform === 'twitter'
                  ? 'text-twitter'
                  : 'text-linkedin'
                : 'text-muted-foreground'
            )}
          />
          <p className="text-sm font-medium">
            {isDragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Images (JPG, PNG, GIF, WebP) up to {MAX_IMAGE_SIZE / (1024 * 1024)}MB
          </p>
          <p className="text-xs text-muted-foreground">
            Videos (MP4, MOV, WebM) up to {MAX_VIDEO_SIZE / (1024 * 1024)}MB
          </p>
        </div>
      )}
    </div>
  )
}

interface MediaPreviewItemProps {
  filename: string
  index: number
  onRemove: () => void
}

function MediaPreviewItem({ filename, index, onRemove }: MediaPreviewItemProps) {
  const [hasError, setHasError] = useState(false)
  const url = getMediaUrl(filename)
  const isVideo = filename.endsWith('.mp4') || filename.endsWith('.mov') || filename.endsWith('.webm')

  return (
    <div className="relative group">
      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
        {hasError ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {isVideo ? <Film className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
          </div>
        ) : isVideo ? (
          <video
            src={url}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
            muted
            playsInline
          />
        ) : (
          <img
            src={url}
            alt={`Media ${index + 1}`}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        )}
      </div>
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove media"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
