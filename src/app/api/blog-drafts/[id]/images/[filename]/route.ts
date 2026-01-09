import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/blog-drafts/[id]/images/[filename] - Remove image from blog draft
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id, filename } = await params
    const supabase = await createClient()

    // Decode filename in case it's URL encoded
    const decodedFilename = decodeURIComponent(filename)

    // Get current draft
    const { data: draft, error: fetchError } = await supabase
      .from('blog_drafts')
      .select('images')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Blog draft not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Remove image from array
    const images = (draft.images || []).filter(
      (img: { filename: string }) => img.filename !== decodedFilename
    )

    // Update draft
    const { data, error } = await supabase
      .from('blog_drafts')
      .update({ images })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error removing image from blog draft:', error)
    return NextResponse.json({ error: 'Failed to remove image' }, { status: 500 })
  }
}
