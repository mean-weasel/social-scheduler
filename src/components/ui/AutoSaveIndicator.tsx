import { cn } from '@/lib/utils'
import { CloudOff, Check, Loader2 } from 'lucide-react'

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus
  className?: string
}

export function AutoSaveIndicator({ status, className }: AutoSaveIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-opacity duration-200',
        status === 'idle' && 'opacity-0',
        status !== 'idle' && 'opacity-100',
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-green-500" />
          <span className="text-green-500">Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <CloudOff className="w-3.5 h-3.5 text-destructive" />
          <span className="text-destructive">Failed to save</span>
        </>
      )}
    </div>
  )
}
