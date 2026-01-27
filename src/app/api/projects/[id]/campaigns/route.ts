import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { transformCampaignFromDb } from '@/lib/utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/campaigns - List campaigns in project
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: projectId } = await context.params
    const supabase = await createClient()

    // Verify project exists and user has access (RLS handles auth)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Fetch campaigns for this project
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const campaigns = (data || []).map(campaign => transformCampaignFromDb(campaign as Record<string, unknown>))
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching project campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}
