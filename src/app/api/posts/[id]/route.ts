import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  draft: ['scheduled', 'archived'],
  scheduled: ['draft', 'published', 'failed', 'archived'],
  published: ['archived'],
  failed: ['draft', 'scheduled', 'archived'],
  archived: ['draft'],
}

// GET /api/posts/[id] - Get single post
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
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

// PATCH /api/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Get current post to validate status transition
    const { data: currentPost, error: fetchError } = await supabase
      .from('posts')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Validate status transition if status is being changed
    if (body.status && body.status !== currentPost.status) {
      const allowed = validTransitions[currentPost.status] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentPost.status} to ${body.status}` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (body.platform !== undefined) updates.platform = body.platform
    if (body.content !== undefined) updates.content = body.content
    if (body.status !== undefined) updates.status = body.status
    if (body.scheduled_at !== undefined || body.scheduledAt !== undefined) {
      updates.scheduled_at = body.scheduled_at || body.scheduledAt
    }
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.campaign_id !== undefined || body.campaignId !== undefined) {
      updates.campaign_id = body.campaign_id || body.campaignId
    }
    if (body.publish_result !== undefined || body.publishResult !== undefined) {
      updates.publish_result = body.publish_result || body.publishResult
    }
    if (body.group_id !== undefined || body.groupId !== undefined) {
      updates.group_id = body.group_id || body.groupId
    }
    if (body.group_type !== undefined || body.groupType !== undefined) {
      updates.group_type = body.group_type || body.groupType
    }

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
