import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/blog-drafts/search - Search blog drafts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q') || searchParams.get('query') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const searchPattern = `%${query}%`

    const { data, error } = await supabase
      .from('blog_drafts')
      .select('*')
      .neq('status', 'archived')
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern},notes.ilike.${searchPattern}`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching blog drafts:', error)
    return NextResponse.json({ error: 'Failed to search blog drafts' }, { status: 500 })
  }
}
