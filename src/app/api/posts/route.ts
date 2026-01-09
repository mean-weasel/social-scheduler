import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/posts - List posts with optional filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const campaignId = searchParams.get('campaignId')
    const groupId = searchParams.get('groupId')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('posts')
      .select('*')
      .order('updated_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }
    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }
    if (groupId) {
      query = query.eq('group_id', groupId)
    }
    if (limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST /api/posts - Create new post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user?.id,
        platform: body.platform,
        content: body.content,
        status: body.status || 'draft',
        scheduled_at: body.scheduled_at || body.scheduledAt,
        notes: body.notes,
        campaign_id: body.campaign_id || body.campaignId,
        group_id: body.group_id || body.groupId,
        group_type: body.group_type || body.groupType,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
