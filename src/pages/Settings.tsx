import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, LogOut, Github, Check, AlertCircle, Sun, Moon, Monitor } from 'lucide-react'
import { useAuth, useAuthStore, parseRepoConfig, validateToken } from '@/lib/auth'
import { verifyRepoAccess, initializePostsDirectory } from '@/lib/github'
import { useTheme, Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function Settings() {
  const navigate = useNavigate()
  const { token, user, config, logout } = useAuth()
  const { setToken, setUser, setConfig } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const [newToken, setNewToken] = useState('')
  const [repoInput, setRepoInput] = useState(config ? `${config.owner}/${config.repo}` : '')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSaveToken = async () => {
    if (!newToken.trim()) {
      setError('Please enter a token')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const userInfo = await validateToken(newToken.trim())
      if (!userInfo) {
        setError('Invalid token. Please check and try again.')
        return
      }

      setToken(newToken.trim())
      setUser(userInfo)
      setNewToken('')
      setSuccess('Token saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to validate token')
    } finally {
      setIsValidating(false)
    }
  }

  const handleSaveRepo = async () => {
    if (!repoInput.trim()) {
      setError('Please enter a repository')
      return
    }

    const parsedConfig = parseRepoConfig(repoInput.trim())
    if (!parsedConfig) {
      setError('Invalid repository format. Use owner/repo or GitHub URL.')
      return
    }

    if (!token) {
      setError('Please add a GitHub token first')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const hasAccess = await verifyRepoAccess(token, parsedConfig)
      if (!hasAccess) {
        setError('Cannot access this repository. Check permissions.')
        return
      }

      // Initialize posts directories
      await initializePostsDirectory(token, parsedConfig)

      setConfig(parsedConfig)
      setSuccess('Repository configured successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to configure repository')
    } finally {
      setIsValidating(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="max-w-2xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl font-display font-semibold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Configure your GitHub connection and preferences.
      </p>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive mb-6 animate-slide-up">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-500 mb-6 animate-slide-up">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Current user */}
      {user && (
        <div className="p-4 rounded-xl border border-border bg-card mb-6">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex-1">
              <div className="font-medium">{user.name || user.login}</div>
              <div className="text-sm text-muted-foreground">@{user.login}</div>
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg',
                'text-sm font-medium text-destructive',
                'hover:bg-destructive/10 transition-colors'
              )}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Theme */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your preferred color scheme.
        </p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = theme === option.value
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                  'text-sm font-medium transition-all',
                  'border-2',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* GitHub Token */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          GitHub Token
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Create a Personal Access Token with <code className="px-1 py-0.5 rounded bg-muted text-xs">repo</code> scope.
        </p>
        <div className="flex gap-3">
          <input
            type="password"
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            placeholder={token ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxx'}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg',
              'bg-background border border-border',
              'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
              'placeholder:text-muted-foreground'
            )}
          />
          <button
            onClick={handleSaveToken}
            disabled={isValidating}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-primary text-primary-foreground font-medium text-sm',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50'
            )}
          >
            {isValidating ? 'Validating...' : 'Save Token'}
          </button>
        </div>
        <a
          href="https://github.com/settings/tokens/new?scopes=repo&description=Social%20Scheduler"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-xs text-primary hover:underline"
        >
          Create a new token on GitHub
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Repository */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Repository
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          The GitHub repository where your posts will be stored.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-background border border-border">
            <Github className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repository"
              className="flex-1 bg-transparent border-none focus:outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleSaveRepo}
            disabled={isValidating || !token}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-primary text-primary-foreground font-medium text-sm',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50'
            )}
          >
            {isValidating ? 'Verifying...' : 'Save Repo'}
          </button>
        </div>
        {config && (
          <div className="flex items-center gap-2 mt-3 text-xs text-green-500">
            <Check className="w-3 h-3" />
            Connected to {config.owner}/{config.repo}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          How it works
        </h2>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              1
            </span>
            <span>Posts are stored as JSON files in your repository's <code className="px-1 py-0.5 rounded bg-muted text-xs">posts/</code> folder.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              2
            </span>
            <span>GitHub Actions runs every 15 minutes to check for scheduled posts.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              3
            </span>
            <span>When a post is due, the workflow publishes it to your connected platforms.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
