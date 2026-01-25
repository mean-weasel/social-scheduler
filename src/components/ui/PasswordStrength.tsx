'use client'

interface PasswordStrengthProps {
  password: string
}

interface StrengthResult {
  score: number // 0-4
  label: string
  color: string
  bgColor: string
}

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: '', color: '', bgColor: 'bg-gray-200 dark:bg-gray-700' }
  }

  let score = 0

  // Length checks
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (password.length >= 14) score++

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  // Cap at 4
  score = Math.min(score, 4)

  const strengthMap: Record<number, Omit<StrengthResult, 'score'>> = {
    0: { label: '', color: '', bgColor: 'bg-gray-200 dark:bg-gray-700' },
    1: { label: 'Weak', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500' },
    2: { label: 'Fair', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500' },
    3: { label: 'Good', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500' },
  }

  return { score, ...strengthMap[score] }
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = calculateStrength(password)

  if (!password) {
    return null
  }

  return (
    <div className="mt-2 space-y-1">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength.score ? strength.bgColor : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      {strength.label && (
        <p className={`text-xs font-medium ${strength.color}`}>
          {strength.label}
        </p>
      )}

      {/* Helpful tips for weak passwords */}
      {strength.score > 0 && strength.score < 3 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Try adding {strength.score < 2 ? 'more characters, ' : ''}
          {!/[A-Z]/.test(password) ? 'uppercase letters, ' : ''}
          {!/\d/.test(password) ? 'numbers, ' : ''}
          {!/[^a-zA-Z0-9]/.test(password) ? 'special characters' : ''}
        </p>
      )}
    </div>
  )
}
