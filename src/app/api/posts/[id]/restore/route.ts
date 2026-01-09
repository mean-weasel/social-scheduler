import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/posts/[id]/restore - Restore an archived post
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current post to validate it's archived
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

    if (currentPost.status !== 'archived') {
      return NextResponse.json({ error: 'Post is not archived' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'draft' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error restoring post:', error)
    return NextResponse.json({ error: 'Failed to restore post' }, { status: 500 })
  }
}
