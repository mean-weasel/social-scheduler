import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Google OAuth token endpoint
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

// GET /api/analytics/auth/callback - Handle OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    let userId: string
    try {
      const auth = await requireAuth()
      userId = auth.userId
    } catch {
      // Redirect to login with error
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/settings?error=unauthorized`)
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Check for error from Google
    if (error) {
      console.error('OAuth error from Google:', error)
      return NextResponse.redirect(
        `${baseUrl}/settings?error=oauth_denied&message=${encodeURIComponent(error)}`
      )
    }

    // Validate code
    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=missing_code`
      )
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID
    const clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET
    const redirectUri = `${baseUrl}/api/analytics/auth/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=not_configured`
      )
    }

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        `${baseUrl}/settings?error=token_exchange_failed`
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, scope } = tokens

    if (!access_token || !refresh_token) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=missing_tokens`
      )
    }

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Store tokens temporarily - we'll need the user to select a property
    // For now, redirect to settings with tokens in URL params (they'll be used client-side)
    // In production, you might use a temporary session/cookie approach

    // We'll store a temporary auth state that can be used to complete the connection
    // This is a simplified approach - in production you might use secure sessions
    const tempAuthData = {
      userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiresAt,
      scopes: scope ? scope.split(' ') : [],
    }

    // Store temp auth in a cookie or return it encoded for the client to use
    // For simplicity, we'll encode it in the URL (base64)
    const encodedAuth = Buffer.from(JSON.stringify(tempAuthData)).toString('base64url')

    // Redirect to settings page with success and the auth data
    return NextResponse.redirect(
      `${baseUrl}/settings?analytics_auth=success&auth_data=${encodedAuth}`
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/settings?error=callback_failed`
    )
  }
}
