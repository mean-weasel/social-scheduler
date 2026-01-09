import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/posts/[id]/archive - Archive a post
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current post to validate transition
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

    if (currentPost.status === 'archived') {
      return NextResponse.json({ error: 'Post is already archived' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error('Error archiving post:', error)
    return NextResponse.json({ error: 'Failed to archive post' }, { status: 500 })
  }
}
