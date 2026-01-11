import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { transformCampaignFromDb } from '@/lib/utils'

// GET /api/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')

    let query = supabase
      .from('campaigns')
      .select('*')
      .order('updated_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform campaigns from snake_case to camelCase
    const campaigns = (data || []).map(campaign => transformCampaignFromDb(campaign as Record<string, unknown>))
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST /api/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    // In E2E test mode, skip user lookup since we bypass auth
    let userId: string | null = null
    if (process.env.E2E_TEST_MODE !== 'true') {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id || null
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId,
        name: body.name,
        description: body.description,
        status: body.status || 'active',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform campaign from snake_case to camelCase
    const campaign = transformCampaignFromDb(data as Record<string, unknown>)
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
