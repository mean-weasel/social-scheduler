import { useEffect, useState, useMemo } from 'react'
import { useCampaignsStore } from '@/lib/campaigns'
import { useProjectsStore } from '@/lib/projects'
import { Project } from '@/lib/posts'

interface ProjectAccount {
  id: string
  projectId: string
  accountId: string
  createdAt: string
}

interface ProjectContext {
  // The project associated with the campaign (if any)
  project: Project | null
  // Project's associated accounts
  accounts: ProjectAccount[]
  // Loading states
  loading: boolean
  // Brand kit helpers
  hashtags: string[]
  brandColors: { primary?: string; secondary?: string; accent?: string }
  logoUrl: string | null
  // Actions
  insertHashtag: (hashtag: string) => string
  insertAllHashtags: () => string
}

/**
 * Hook to get project context based on a campaign ID.
 * When a post is being created/edited in a campaign that belongs to a project,
 * this hook provides access to the project's brand kit, hashtags, and accounts.
 */
export function useProjectContext(campaignId?: string): ProjectContext {
  const { getCampaign, initialized: campaignsInitialized } = useCampaignsStore()
  const { getProject, initialized: projectsInitialized, fetchProjects } = useProjectsStore()

  const [accounts, setAccounts] = useState<ProjectAccount[]>([])
  const [loading, setLoading] = useState(false)

  // Get the campaign and its associated project
  const campaign = campaignId ? getCampaign(campaignId) : undefined
  const projectId = campaign?.projectId
  const project = projectId ? (getProject(projectId) ?? null) : null

  // Fetch projects if not initialized
  useEffect(() => {
    if (!projectsInitialized && campaignId) {
      fetchProjects()
    }
  }, [projectsInitialized, campaignId, fetchProjects])

  // Fetch project accounts when project changes
  useEffect(() => {
    if (!projectId) {
      setAccounts([])
      return
    }

    const fetchAccounts = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/projects/${projectId}/accounts`)
        if (res.ok) {
          const data = await res.json()
          setAccounts(data.accounts || [])
        }
      } catch (error) {
        console.error('Failed to fetch project accounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [projectId])

  // Memoize derived values
  const hashtags = useMemo(() => project?.hashtags || [], [project])
  const brandColors = useMemo(() => project?.brandColors || {}, [project])
  const logoUrl = useMemo(() => project?.logoUrl || null, [project])

  // Helper to insert a single hashtag
  const insertHashtag = (hashtag: string): string => {
    // Ensure hashtag starts with #
    return hashtag.startsWith('#') ? hashtag : `#${hashtag}`
  }

  // Helper to insert all project hashtags as a string
  const insertAllHashtags = (): string => {
    return hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
  }

  return {
    project,
    accounts,
    loading: loading || !campaignsInitialized || !projectsInitialized,
    hashtags,
    brandColors,
    logoUrl,
    insertHashtag,
    insertAllHashtags,
  }
}
