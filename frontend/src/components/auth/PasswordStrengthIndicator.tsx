"use client"

import { useMemo } from "react"
import { Check, X, Info } from "lucide-react"
import { cn } from "@/lib/conn/utils"
import { PasswordStrength, PasswordRequirement, PasswordAnalysis } from "./types"

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
  showRequirements?: boolean
  showStrengthBar?: boolean
  showSuggestions?: boolean
  compact?: boolean
}

// Password strength analysis function
function analyzePassword(password: string): PasswordAnalysis {
  const requirements: PasswordRequirement[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      regex: /.{8,}/,
      met: false,
      description: 'Password must be at least 8 characters long'
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      regex: /[a-z]/,
      met: false,
      description: 'Include at least one lowercase letter (a-z)'
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      regex: /[A-Z]/,
      met: false,
      description: 'Include at least one uppercase letter (A-Z)'
    },
    {
      id: 'number',
      label: 'One number',
      regex: /\d/,
      met: false,
      description: 'Include at least one number (0-9)'
    },
    {
      id: 'special',
      label: 'One special character',
      regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      met: false,
      description: 'Include at least one special character (!@#$%^&*)'
    }
  ]

  // Check which requirements are met
  requirements.forEach(req => {
    req.met = req.regex.test(password)
  })

  const metRequirements = requirements.filter(req => req.met).length
  const totalRequirements = requirements.length

  // Calculate strength score (0-100)
  let score = 0
  
  // Base score from requirements
  score += (metRequirements / totalRequirements) * 60

  // Length bonus
  if (password.length >= 12) score += 15
  else if (password.length >= 10) score += 10
  else if (password.length >= 8) score += 5

  // Complexity bonus
  const hasRepeating = /(.)\1{2,}/.test(password)
  const hasSequential = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(password)
  const hasCommonPatterns = /(?:password|123456|qwerty|admin|login)/i.test(password)

  if (!hasRepeating) score += 5
  if (!hasSequential) score += 5
  if (!hasCommonPatterns) score += 10
  if (password.length > 16) score += 5

  // Determine strength level
  let strength: PasswordStrength
  if (score >= 90) strength = 'very-strong'
  else if (score >= 75) strength = 'strong'
  else if (score >= 60) strength = 'good'
  else if (score >= 40) strength = 'fair'
  else strength = 'weak'

  // Generate suggestions
  const suggestions: string[] = []
  if (password.length < 8) suggestions.push('Use at least 8 characters')
  if (password.length < 12) suggestions.push('Consider using 12+ characters for better security')
  if (!requirements.find(r => r.id === 'lowercase')?.met) suggestions.push('Add lowercase letters')
  if (!requirements.find(r => r.id === 'uppercase')?.met) suggestions.push('Add uppercase letters')
  if (!requirements.find(r => r.id === 'number')?.met) suggestions.push('Add numbers')
  if (!requirements.find(r => r.id === 'special')?.met) suggestions.push('Add special characters')
  if (hasRepeating) suggestions.push('Avoid repeating characters')
  if (hasSequential) suggestions.push('Avoid sequential patterns')
  if (hasCommonPatterns) suggestions.push('Avoid common words or patterns')

  // Estimate crack time (simplified)
  let estimatedCrackTime = 'Less than a second'
  if (score >= 90) estimatedCrackTime = 'Centuries'
  else if (score >= 75) estimatedCrackTime = 'Years'
  else if (score >= 60) estimatedCrackTime = 'Months'
  else if (score >= 40) estimatedCrackTime = 'Days'
  else if (score >= 20) estimatedCrackTime = 'Hours'

  return {
    strength,
    score: Math.min(100, Math.max(0, score)),
    requirements,
    suggestions,
    estimatedCrackTime
  }
}

export function PasswordStrengthIndicator({
  password,
  className,
  showRequirements = true,
  showStrengthBar = true,
  showSuggestions = false,
  compact = false
}: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(() => analyzePassword(password), [password])

  if (!password) return null

  const strengthConfig = {
    'weak': {
      color: 'bg-destructive',
      textColor: 'text-destructive',
      label: 'Weak',
      description: 'This password is easily guessable'
    },
    'fair': {
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      label: 'Fair',
      description: 'This password could be stronger'
    },
    'good': {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      label: 'Good',
      description: 'This password is reasonably secure'
    },
    'strong': {
      color: 'bg-green-500',
      textColor: 'text-green-600',
      label: 'Strong',
      description: 'This password is very secure'
    },
    'very-strong': {
      color: 'bg-green-600',
      textColor: 'text-green-700',
      label: 'Very Strong',
      description: 'This password is extremely secure'
    }
  }

  const config = strengthConfig[analysis.strength]

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      {showStrengthBar && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Password Strength
            </span>
            <span className={cn("text-xs font-medium", config.textColor)}>
              {config.label}
            </span>
          </div>
          
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out",
                config.color
              )}
              style={{ width: `${analysis.score}%` }}
            />
          </div>
          
          {!compact && (
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          )}
        </div>
      )}

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            Password Requirements
          </h4>
          <ul className="space-y-1">
            {analysis.requirements.map((requirement) => (
              <li
                key={requirement.id}
                className="flex items-center gap-2 text-xs"
              >
                {requirement.met ? (
                  <Check className="h-3 w-3 text-success flex-shrink-0" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "transition-colors duration-200",
                    requirement.met
                      ? "text-success line-through"
                      : "text-muted-foreground"
                  )}
                >
                  {requirement.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && analysis.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            Suggestions
          </h4>
          <ul className="space-y-1">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="text-xs text-muted-foreground">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Crack Time Estimate */}
      {!compact && (
        <div className="text-xs text-muted-foreground">
          <strong>Estimated crack time:</strong> {analysis.estimatedCrackTime}
        </div>
      )}
    </div>
  )
}
