import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { transformAnalyticsConnectionFromDb } from '@/lib/utils'
import { requireAuth } from '@/lib/auth'

// GET /api/analytics/connections - List connections
export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('analytics_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform connections from snake_case to camelCase
    const connections = (data || []).map((conn) =>
      transformAnalyticsConnectionFromDb(conn as Record<string, unknown>)
    )

    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Error fetching analytics connections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics connections' },
      { status: 500 }
    )
  }
}

// POST /api/analytics/connections - Create connection
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.propertyId || typeof body.propertyId !== 'string') {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    if (!body.accessToken || typeof body.accessToken !== 'string') {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      )
    }

    if (!body.refreshToken || typeof body.refreshToken !== 'string') {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    if (!body.tokenExpiresAt || typeof body.tokenExpiresAt !== 'string') {
      return NextResponse.json(
        { error: 'Token expiration is required' },
        { status: 400 }
      )
    }

    // Check if connection already exists for this property
    const { data: existing } = await supabase
      .from('analytics_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', body.propertyId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Connection already exists for this property' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('analytics_connections')
      .insert({
        user_id: userId,
        provider: body.provider || 'google_analytics',
        property_id: body.propertyId,
        property_name: body.propertyName || null,
        access_token: body.accessToken,
        refresh_token: body.refreshToken,
        token_expires_at: body.tokenExpiresAt,
        scopes: body.scopes || [],
        project_id: body.projectId || null,
        sync_status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform connection from snake_case to camelCase
    const connection = transformAnalyticsConnectionFromDb(
      data as Record<string, unknown>
    )
    return NextResponse.json({ connection }, { status: 201 })
  } catch (error) {
    console.error('Error creating analytics connection:', error)
    return NextResponse.json(
      { error: 'Failed to create analytics connection' },
      { status: 500 }
    )
  }
}
