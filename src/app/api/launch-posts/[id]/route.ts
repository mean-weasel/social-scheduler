import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Transform snake_case DB response to camelCase for frontend
function transformLaunchPost(data: Record<string, unknown>) {
  return {
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    platform: data.platform,
    status: data.status,
    scheduledAt: data.scheduled_at,
    postedAt: data.posted_at,
    title: data.title,
    url: data.url,
    description: data.description,
    platformFields: data.platform_fields || {},
    campaignId: data.campaign_id,
    notes: data.notes,
  }
}

// GET /api/launch-posts/[id] - Get single launch post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Defense-in-depth: filter by user_id
    const { data, error } = await supabase
      .from('launch_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Launch post not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const launchPost = transformLaunchPost(data as Record<string, unknown>)
    return NextResponse.json({ launchPost })
  } catch (error) {
    console.error('Error fetching launch post:', error)
    return NextResponse.json({ error: 'Failed to fetch launch post' }, { status: 500 })
  }
}

// PATCH /api/launch-posts/[id] - Update launch post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Build update object - only include fields that were provided
    const updates: Record<string, unknown> = {}
    if (body.platform !== undefined) updates.platform = body.platform
    if (body.status !== undefined) updates.status = body.status
    if (body.title !== undefined) updates.title = body.title
    if (body.url !== undefined) updates.url = body.url
    if (body.description !== undefined) updates.description = body.description
    if (body.platformFields !== undefined) updates.platform_fields = body.platformFields
    if (body.campaignId !== undefined) updates.campaign_id = body.campaignId
    if (body.scheduledAt !== undefined) updates.scheduled_at = body.scheduledAt
    if (body.postedAt !== undefined) updates.posted_at = body.postedAt
    if (body.notes !== undefined) updates.notes = body.notes

    const { data, error } = await supabase
      .from('launch_posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Launch post not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const launchPost = transformLaunchPost(data as Record<string, unknown>)
    return NextResponse.json({ launchPost })
  } catch (error) {
    console.error('Error updating launch post:', error)
    return NextResponse.json({ error: 'Failed to update launch post' }, { status: 500 })
  }
}

// DELETE /api/launch-posts/[id] - Delete launch post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('launch_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting launch post:', error)
    return NextResponse.json({ error: 'Failed to delete launch post' }, { status: 500 })
  }
}
