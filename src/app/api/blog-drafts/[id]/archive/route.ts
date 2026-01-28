import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// POST /api/blog-drafts/[id]/archive - Archive a blog draft
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const supabase = await createClient()

    // Defense-in-depth: filter by user_id alongside RLS
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

    if (currentDraft.status === 'archived') {
      return NextResponse.json({ error: 'Blog draft is already archived' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('blog_drafts')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ draft: data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error archiving blog draft:', error)
    return NextResponse.json({ error: 'Failed to archive blog draft' }, { status: 500 })
  }
}
