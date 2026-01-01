import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Github, ArrowRight, Calendar, Copy, Check, ExternalLink, Loader2 } from 'lucide-react'
import {
  useAuthStore,
  parseRepoConfig,
  fetchGitHubUser,
  requestDeviceCode,
  pollForToken,
  DeviceCodeResponse,
} from '@/lib/auth'
import { verifyRepoAccess, initializePostsDirectory } from '@/lib/github'
import { cn } from '@/lib/utils'

type Step = 'start' | 'device-code' | 'repo'

export function Login() {
  const navigate = useNavigate()
  const { setToken, setUser, setConfig } = useAuthStore()
  const token = useAuthStore((s) => s.token)

  const [step, setStep] = useState<Step>('start')
  const [deviceCode, setDeviceCode] = useState<DeviceCodeResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [repoInput, setRepoInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setPollCount] = useState(0)

  // Start the device flow
  const handleStartAuth = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const code = await requestDeviceCode()
      setDeviceCode(code)
      setStep('device-code')

      // Start polling for the token
      const accessToken = await pollForToken(
        code.device_code,
        code.interval,
        code.expires_in,
        () => setPollCount((c) => c + 1)
      )

      // Got the token! Fetch user info
      const user = await fetchGitHubUser(accessToken)
      setToken(accessToken)
      setUser(user)
      setStep('repo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setStep('start')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy user code to clipboard
  const handleCopyCode = useCallback(() => {
    if (deviceCode?.user_code) {
      navigator.clipboard.writeText(deviceCode.user_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [deviceCode])

  // Open GitHub verification page
  const handleOpenGitHub = useCallback(() => {
    if (deviceCode?.verification_uri) {
      window.open(deviceCode.verification_uri, '_blank')
    }
  }, [deviceCode])

  // Configure repository
  const handleRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoInput.trim() || !token) return

    const parsedConfig = parseRepoConfig(repoInput.trim())
    if (!parsedConfig) {
      setError('Invalid format. Use owner/repo or a GitHub URL.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const hasAccess = await verifyRepoAccess(token, parsedConfig)
      if (!hasAccess) {
        setError('Cannot access this repository. Check the name and your permissions.')
        return
      }

      await initializePostsDirectory(token, parsedConfig)
      setConfig(parsedConfig)
      navigate('/')
    } catch {
      setError('Failed to configure repository')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-twitter via-linkedin to-reddit flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-semibold text-2xl tracking-tight">
            Social Scheduler
          </span>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl border border-border bg-card">
          {/* Step 1: Start */}
          {step === 'start' && (
            <>
              <h1 className="text-xl font-display font-semibold mb-2 text-center">
                Sign in with GitHub
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                We'll use GitHub to store your scheduled posts securely in your own repository.
              </p>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4 animate-slide-up">
                  {error}
                </div>
              )}

              <button
                onClick={handleStartAuth}
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-3 py-3 rounded-lg',
                  'bg-[#24292f] text-white',
                  'font-medium',
                  'hover:bg-[#24292f]/90 transition-colors',
                  'disabled:opacity-50'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Github className="w-5 h-5" />
                )}
                {isLoading ? 'Connecting...' : 'Continue with GitHub'}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-6">
                No password needed. You'll authorize via GitHub's secure login.
              </p>
            </>
          )}

          {/* Step 2: Device Code */}
          {step === 'device-code' && deviceCode && (
            <>
              <h1 className="text-xl font-display font-semibold mb-2 text-center">
                Enter this code on GitHub
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Copy the code below and enter it at github.com/login/device
              </p>

              {/* User code display */}
              <div className="relative mb-4">
                <div
                  className={cn(
                    'flex items-center justify-center gap-3 py-4 px-6 rounded-xl',
                    'bg-background border-2 border-dashed border-border',
                    'font-mono text-2xl font-bold tracking-[0.3em]',
                    'select-all cursor-pointer',
                    'hover:border-primary/50 transition-colors'
                  )}
                  onClick={handleCopyCode}
                >
                  {deviceCode.user_code}
                </div>
                <button
                  onClick={handleCopyCode}
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2',
                    'p-2 rounded-md',
                    'hover:bg-accent transition-colors',
                    copied ? 'text-green-500' : 'text-muted-foreground'
                  )}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Open GitHub button */}
              <button
                onClick={handleOpenGitHub}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-lg',
                  'bg-gradient-to-r from-twitter to-[#0d8bd9] text-white',
                  'font-medium',
                  'hover:opacity-90 transition-opacity'
                )}
              >
                Open github.com/login/device
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-3 mt-6 py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Waiting for authorization...
                </span>
              </div>

              {/* Expire warning */}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Code expires in {Math.floor(deviceCode.expires_in / 60)} minutes
              </p>
            </>
          )}

          {/* Step 3: Repository */}
          {step === 'repo' && (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
              </div>

              <h1 className="text-xl font-display font-semibold mb-2 text-center">
                Connected to GitHub!
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Now choose a repository to store your scheduled posts.
              </p>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-4 animate-slide-up">
                  {error}
                </div>
              )}

              <form onSubmit={handleRepoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Repository
                  </label>
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="username/social-posts"
                      className={cn(
                        'w-full pl-11 pr-4 py-3 rounded-lg',
                        'bg-background border border-border',
                        'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
                        'placeholder:text-muted-foreground'
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Create a new repo or use an existing one. We'll add a posts/ folder.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !repoInput.trim()}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-lg',
                    'bg-gradient-to-r from-twitter to-[#0d8bd9] text-white',
                    'font-medium',
                    'hover:opacity-90 transition-opacity',
                    'disabled:opacity-50'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Your data stays in your GitHub repository. We never store your posts.
        </p>
      </div>
    </div>
  )
}
