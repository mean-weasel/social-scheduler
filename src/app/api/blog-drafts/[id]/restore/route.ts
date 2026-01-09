import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/blog-drafts/[id]/restore - Restore an archived blog draft
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: currentDraft, error: fetchError } = await supabase
      .from('blog_drafts')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blog draft not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (currentDraft.status !== 'archived') {
      return NextResponse.json({ error: 'Blog draft is not archived' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('blog_drafts')
      .update({ status: 'draft' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error restoring blog draft:', error)
    return NextResponse.json({ error: 'Failed to restore blog draft' }, { status: 500 })
  }
}
