import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Calculate word count from markdown content
function calculateWordCount(content: string): number {
  if (!content) return 0
  const text = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_~>\-|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text ? text.split(' ').length : 0
}

// Valid status transitions for blog drafts
const validTransitions: Record<string, string[]> = {
  draft: ['scheduled', 'archived'],
  scheduled: ['draft', 'published', 'archived'],
  published: ['archived'],
  archived: ['draft'],
}

// GET /api/blog-drafts/[id] - Get single blog draft
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

    // Defense-in-depth: filter by user_id even though RLS should handle this
    const { data, error } = await supabase
      .from('blog_drafts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blog draft not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ draft: data })
  } catch (error) {
    console.error('Error fetching blog draft:', error)
    return NextResponse.json({ error: 'Failed to fetch blog draft' }, { status: 500 })
  }
}

// PATCH /api/blog-drafts/[id] - Update blog draft
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

    // Get current draft to validate status transition (with ownership check)
    const { data: currentDraft, error: fetchError } = await supabase
      .from('blog_drafts')
      .select('status')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blog draft not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Validate status transition
    if (body.status && body.status !== currentDraft.status) {
      const allowed = validTransitions[currentDraft.status] || []
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentDraft.status} to ${body.status}` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.content !== undefined) {
      updates.content = body.content
      updates.word_count = calculateWordCount(body.content)
    }
    if (body.date !== undefined) updates.date = body.date
    if (body.status !== undefined) updates.status = body.status
    if (body.scheduled_at !== undefined || body.scheduledAt !== undefined) {
      updates.scheduled_at = body.scheduled_at || body.scheduledAt
    }
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.campaign_id !== undefined || body.campaignId !== undefined) {
      updates.campaign_id = body.campaign_id || body.campaignId
    }
    if (body.images !== undefined) updates.images = body.images

    const { data, error } = await supabase
      .from('blog_drafts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blog draft not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ draft: data })
  } catch (error) {
    console.error('Error updating blog draft:', error)
    return NextResponse.json({ error: 'Failed to update blog draft' }, { status: 500 })
  }
}

// DELETE /api/blog-drafts/[id] - Delete blog draft
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
      .from('blog_drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog draft:', error)
    return NextResponse.json({ error: 'Failed to delete blog draft' }, { status: 500 })
  }
}
