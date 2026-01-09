import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/blog-drafts/[id]/archive - Archive a blog draft
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

    if (currentDraft.status === 'archived') {
      return NextResponse.json({ error: 'Blog draft is already archived' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('blog_drafts')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ draft: data })
  } catch (error) {
    console.error('Error archiving blog draft:', error)
    return NextResponse.json({ error: 'Failed to archive blog draft' }, { status: 500 })
  }
}
