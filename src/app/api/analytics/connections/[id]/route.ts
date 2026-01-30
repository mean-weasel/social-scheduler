import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  transformAnalyticsConnectionFromDb,
  transformAnalyticsConnectionToDb,
} from '@/lib/utils'
import { requireAuth } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/analytics/connections/[id] - Get single connection
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('analytics_connections')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Connection not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const connection = transformAnalyticsConnectionFromDb(
      data as Record<string, unknown>
    )
    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Error fetching analytics connection:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics connection' },
      { status: 500 }
    )
  }
}

// PATCH /api/analytics/connections/[id] - Update connection
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Require authentication
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const supabase = await createClient()
    const body = await request.json()

    // Transform updates to snake_case
    const updates = transformAnalyticsConnectionToDb(body)

    // Update with ownership check (RLS handles this, but add defense-in-depth)
    const { data, error } = await supabase
      .from('analytics_connections')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Connection not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const connection = transformAnalyticsConnectionFromDb(
      data as Record<string, unknown>
    )
    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Error updating analytics connection:', error)
    return NextResponse.json(
      { error: 'Failed to update analytics connection' },
      { status: 500 }
    )
  }
}

// DELETE /api/analytics/connections/[id] - Delete connection
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    // Require authentication
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const supabase = await createClient()

    // Delete with ownership check
    const { error } = await supabase
      .from('analytics_connections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting analytics connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete analytics connection' },
      { status: 500 }
    )
  }
}
