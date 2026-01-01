// GitHub OAuth authentication using Device Flow
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GitHubConfig } from './github'

// Your GitHub OAuth App Client ID
// Create one at: https://github.com/settings/applications/new
// Set "Device Flow" to enabled in the OAuth App settings
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23liXXXXXXXXXXXXXX'

interface AuthState {
  token: string | null
  user: GitHubUser | null
  config: GitHubConfig | null
  isLoading: boolean
  error: string | null
  isDemoMode: boolean
}

interface AuthActions {
  setToken: (token: string) => void
  setUser: (user: GitHubUser) => void
  setConfig: (config: GitHubConfig) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  clearError: () => void
  enterDemoMode: () => void
  exitDemoMode: () => void
}

// Demo user for preview mode
export const DEMO_USER: GitHubUser = {
  login: 'demo-user',
  name: 'Demo User',
  avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4',
  email: 'demo@example.com',
}

export const DEMO_CONFIG: GitHubConfig = {
  owner: 'demo',
  repo: 'social-scheduler',
}

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  email: string | null
}

// Device Flow types
export interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export interface DeviceFlowState {
  deviceCode: DeviceCodeResponse | null
  isPolling: boolean
  error: string | null
}

// Zustand store with persistence
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      config: null,
      isLoading: false,
      error: null,
      isDemoMode: false,

      setToken: (token) => set({ token, error: null }),
      setUser: (user) => set({ user }),
      setConfig: (config) => set({ config }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => set({ token: null, user: null, config: null, isDemoMode: false }),
      clearError: () => set({ error: null }),
      enterDemoMode: () =>
        set({
          isDemoMode: true,
          user: DEMO_USER,
          config: DEMO_CONFIG,
          token: 'demo-token',
          error: null,
        }),
      exitDemoMode: () =>
        set({
          isDemoMode: false,
          user: null,
          config: null,
          token: null,
        }),
    }),
    {
      name: 'social-scheduler-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        config: state.config,
        isDemoMode: state.isDemoMode,
      }),
    }
  )
)

// Hook for auth state
export function useAuth() {
  const {
    token,
    user,
    config,
    isLoading,
    error,
    isDemoMode,
    logout,
    enterDemoMode,
    exitDemoMode,
  } = useAuthStore()

  return {
    token,
    user,
    config,
    isLoading,
    error,
    isDemoMode,
    isAuthenticated: !!token && !!user && !!config,
    logout,
    enterDemoMode,
    exitDemoMode,
  }
}

// ============================================
// GitHub Device Flow
// ============================================

// Step 1: Request device and user codes
export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  // Use CORS proxy in development to avoid CORS issues
  const url = import.meta.env.DEV
    ? 'http://localhost:8010/proxy/login/device/code'
    : 'https://github.com/login/device/code'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo user:email',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to request device code: ${error}`)
  }

  return response.json()
}

// Step 2: Poll for the access token
export async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresIn: number,
  onPoll?: () => void
): Promise<string> {
  const startTime = Date.now()
  const expiresAt = startTime + expiresIn * 1000

  while (Date.now() < expiresAt) {
    // Wait for the specified interval
    await new Promise((resolve) => setTimeout(resolve, interval * 1000))

    onPoll?.()

    try {
      // Use CORS proxy in development to avoid CORS issues
      const tokenUrl = import.meta.env.DEV
        ? 'http://localhost:8010/proxy/login/oauth/access_token'
        : 'https://github.com/login/oauth/access_token'

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      })

      const data = await response.json()

      if (data.access_token) {
        return data.access_token
      }

      if (data.error === 'authorization_pending') {
        // User hasn't authorized yet, keep polling
        continue
      }

      if (data.error === 'slow_down') {
        // We're polling too fast, increase interval
        interval += 5
        continue
      }

      if (data.error === 'expired_token') {
        throw new Error('The device code has expired. Please try again.')
      }

      if (data.error === 'access_denied') {
        throw new Error('Authorization was denied. Please try again.')
      }

      if (data.error) {
        throw new Error(data.error_description || data.error)
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('expired')) {
        throw err
      }
      // Network error, keep trying
      console.error('Poll error:', err)
    }
  }

  throw new Error('Authorization timed out. Please try again.')
}

// Combined flow: request code and poll
export async function startDeviceFlow(
  onCodeReceived: (code: DeviceCodeResponse) => void,
  onPoll?: () => void
): Promise<string> {
  const deviceCode = await requestDeviceCode()
  onCodeReceived(deviceCode)

  const token = await pollForToken(
    deviceCode.device_code,
    deviceCode.interval,
    deviceCode.expires_in,
    onPoll
  )

  return token
}

// ============================================
// User & Token Utilities
// ============================================

// Fetch user info from GitHub
export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  return response.json()
}

// Validate a token by fetching user info
export async function validateToken(token: string): Promise<GitHubUser | null> {
  try {
    return await fetchGitHubUser(token)
  } catch {
    return null
  }
}

// Parse owner/repo from URL or string
export function parseRepoConfig(input: string): GitHubConfig | null {
  // Try URL format: https://github.com/owner/repo
  const urlMatch = input.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, '') }
  }

  // Try owner/repo format
  const slashMatch = input.match(/^([^/]+)\/([^/]+)$/)
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] }
  }

  return null
}
