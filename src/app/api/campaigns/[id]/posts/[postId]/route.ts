import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/campaigns/[id]/posts/[postId] - Remove post from campaign
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const supabase = await createClient()

    // Verify the post belongs to this campaign
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('campaign_id')
      .eq('id', postId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (post.campaign_id !== id) {
      return NextResponse.json({ error: 'Post does not belong to this campaign' }, { status: 400 })
    }

    // Remove campaign association
    const { data, error } = await supabase
      .from('posts')
      .update({ campaign_id: null })
      .eq('id', postId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error removing post from campaign:', error)
    return NextResponse.json({ error: 'Failed to remove post from campaign' }, { status: 500 })
  }
}
