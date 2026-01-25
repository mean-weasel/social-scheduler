import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  // SECURITY: Never allow reset in production environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Reset endpoint is disabled in production' },
      { status: 403 }
    )
  }

  // Only allow in E2E test mode
  if (process.env.E2E_TEST_MODE !== 'true') {
    return NextResponse.json(
      { error: 'Reset endpoint only available in test mode' },
      { status: 403 }
    )
  }

  try {
    const supabase = await createClient()

    // Delete all posts, campaigns, and blog_drafts for testing
    // Note: In test mode, RLS is bypassed so this works without auth
    await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('blog_drafts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    )
  }
}
