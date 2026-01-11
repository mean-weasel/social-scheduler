import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { transformPostFromDb } from '@/lib/utils'

// GET /api/campaigns/[id]/posts - Get posts for campaign
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('campaign_id', id)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const posts = (data || []).map(post => transformPostFromDb(post as Record<string, unknown>))
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching campaign posts:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign posts' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/posts - Add post to campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const postId = body.postId || body.post_id

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Update post with campaign_id
    const { data, error } = await supabase
      .from('posts')
      .update({ campaign_id: id })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const post = transformPostFromDb(data as Record<string, unknown>)
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error adding post to campaign:', error)
    return NextResponse.json({ error: 'Failed to add post to campaign' }, { status: 500 })
  }
}
