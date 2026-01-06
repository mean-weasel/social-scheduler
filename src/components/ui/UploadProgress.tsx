import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface UploadProgressProps {
  progress: number // 0-100
  filename?: string
  className?: string
}

export function UploadProgress({ progress, filename, className }: UploadProgressProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 bg-accent/50 rounded-lg', className)}>
      <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {filename && (
          <p className="text-xs text-muted-foreground truncate mb-1">{filename}</p>
        )}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-200 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium tabular-nums">
        {progress}%
      </span>
    </div>
  )
}
