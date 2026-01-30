'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { LaunchPostForm } from '@/components/launch-posts/LaunchPostForm'

function NewLaunchPostContent() {
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('campaignId') || undefined

  return <LaunchPostForm campaignId={campaignId} />
}

export default function NewLaunchPostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gold))]" />
        </div>
      }
    >
      <NewLaunchPostContent />
    </Suspense>
  )
}
