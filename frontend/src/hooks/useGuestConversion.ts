'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

// DISABLED FOR CORE BUILD
// import { GuestConversionService } from '../../selly-legacy-nextjs-backend/business-logic/auth/auth/guestConversionService'
// DISABLED FOR CORE BUILD
// import { UnifiedSessionManager } from '../../selly-legacy-nextjs-backend/business-logic/session/session/unifiedSessionManager'
import { 
  GuestSessionData, 
  UserRegistrationData, 
  ConversionResult 
} from '@/components/auth/types'
// DISABLED FOR CORE BUILD
// import { GuestSession } from '../../selly-legacy-nextjs-backend/business-logic/session/session/unifiedTypes'

interface UseGuestConversionOptions {
  autoTrigger?: boolean
  minInteractions?: number
  onConversionSuccess?: (result: ConversionResult) => void
  onConversionError?: (error: string) => void
}

interface UseGuestConversionReturn {
  // State
  guestSessionData: GuestSessionData | null
  isEligibleForConversion: boolean
  shouldShowPrompt: boolean
  isConverting: boolean
  conversionError: string | null

  // Actions
  triggerConversionPrompt: () => void
  dismissPrompt: () => void
  skipConversion: () => void
  convertToAuth: (userData: UserRegistrationData) => Promise<ConversionResult>
  checkEligibility: () => Promise<boolean>

  // Utils
  getInteractionCount: () => number
  getConversionAttempts: () => number
}

export function useGuestConversion(
  options: UseGuestConversionOptions = {}
): UseGuestConversionReturn {
  const {
    autoTrigger = true,
    minInteractions = 3,
    onConversionSuccess,
    onConversionError
  } = options

  const router = useRouter()
  const conversionService = useRef(GuestConversionService.getInstance())
  const sessionManager = useRef(UnifiedSessionManager.getInstance())

  const [guestSessionData, setGuestSessionData] = useState<GuestSessionData | null>(null)
  const [isEligibleForConversion, setIsEligibleForConversion] = useState(false)
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)

  // Load guest session data
  const loadGuestSession = useCallback(async () => {
    try {
      // Get current session from session manager
      const currentSessionId = localStorage.getItem('selly_current_session_id')
      if (!currentSessionId) return

      const session = await sessionManager.current.getSession(currentSessionId)
      if (!session || session.type !== 'guest') return

      const guestSession = session as unknown as GuestSession

      // Convert to GuestSessionData format
      const guestData: GuestSessionData = {
        sessionId: guestSession.id,
        guestUuid: guestSession.guestUuid,
        conversationHistory: guestSession.conversationHistory || [],
        userPreferences: {
          language: guestSession.userPreferences?.language || 'id',
          theme: 'auto' as 'light' | 'dark' | 'auto',
          dataFormat: (guestSession.userPreferences?.dataFormat === 'raw' ? 'summary' : guestSession.userPreferences?.dataFormat) || 'summary',
          verbosity: (guestSession.userPreferences?.verbosity === 'standard' || guestSession.userPreferences?.verbosity === 'minimal' ? 'detailed' : guestSession.userPreferences?.verbosity) || 'detailed',
          notifications: true
        },
        createdAt: guestSession.createdAt,
        lastAccessedAt: guestSession.lastAccessedAt,
        interactionCount: guestSession.conversationHistory?.length || 0,
        conversionEligible: guestSession.conversionEligible || false,
        conversionAttempts: guestSession.conversionAttempts || 0
      }

      setGuestSessionData(guestData)

      // Check eligibility
      const eligible = await conversionService.current.isConversionEligible(guestData)
      setIsEligibleForConversion(eligible)

      // Auto-trigger prompt if conditions are met
      if (autoTrigger && eligible && guestData.interactionCount >= minInteractions) {
        const dismissed = localStorage.getItem('guest-conversion-dismissed')
        const lastPromptTime = localStorage.getItem('guest-conversion-last-prompt')
        const now = Date.now()
        const oneHour = 60 * 60 * 1000

        // Don't show if dismissed permanently or shown recently
        if (dismissed !== 'true' && (!lastPromptTime || now - parseInt(lastPromptTime) > oneHour)) {
          setShouldShowPrompt(true)
          localStorage.setItem('guest-conversion-last-prompt', now.toString())
        }
      }

    } catch (error) {
      console.error('❌ [USE_GUEST_CONVERSION] Failed to load guest session:', error)
    }
  }, [autoTrigger, minInteractions])

  // Initialize on mount
  useEffect(() => {
    loadGuestSession()
  }, [loadGuestSession])

  // Reload when session changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selly_current_session_id') {
        loadGuestSession()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [loadGuestSession])

  const triggerConversionPrompt = useCallback(() => {
    if (guestSessionData && isEligibleForConversion) {
      setShouldShowPrompt(true)
      localStorage.setItem('guest-conversion-last-prompt', Date.now().toString())
    }
  }, [guestSessionData, isEligibleForConversion])

  const dismissPrompt = useCallback(() => {
    setShouldShowPrompt(false)
  }, [])

  const skipConversion = useCallback(() => {
    setShouldShowPrompt(false)
    
    // Track skip event
    if (guestSessionData) {
      conversionService.current.trackConversionAttempt(guestSessionData.sessionId)
    }

    // Set cooldown period
    const cooldownEnd = Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    localStorage.setItem('guest-conversion-cooldown', cooldownEnd.toString())
  }, [guestSessionData])

  const convertToAuth = useCallback(async (userData: UserRegistrationData): Promise<ConversionResult> => {
    if (!guestSessionData) {
      const error = 'No guest session data available'
      setConversionError(error)
      onConversionError?.(error)
      return { success: false, error }
    }

    setIsConverting(true)
    setConversionError(null)

    try {
      // Track conversion attempt
      await conversionService.current.trackConversionAttempt(guestSessionData.sessionId)

      // Perform conversion
      const result = await conversionService.current.convertGuestToAuth(
        guestSessionData,
        userData
      )

      if (result.success) {
        // Clear guest session data
        setGuestSessionData(null)
        setShouldShowPrompt(false)
        
        // Clear local storage flags
        localStorage.removeItem('guest-conversion-dismissed')
        localStorage.removeItem('guest-conversion-last-prompt')
        localStorage.removeItem('guest-conversion-cooldown')

        // Update current session ID
        if (result.sessionId) {
          localStorage.setItem('selly_current_session_id', result.sessionId)
        }

        toast.success('Akun berhasil dibuat! Selamat datang di SELLICA!')
        
        onConversionSuccess?.(result)

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)

      } else {
        setConversionError(result.error || 'Conversion failed')
        onConversionError?.(result.error || 'Conversion failed')
      }

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setConversionError(errorMessage)
      onConversionError?.(errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsConverting(false)
    }
  }, [guestSessionData, onConversionSuccess, onConversionError, router])

  const checkEligibility = useCallback(async (): Promise<boolean> => {
    if (!guestSessionData) return false

    try {
      const eligible = await conversionService.current.isConversionEligible(guestSessionData)
      setIsEligibleForConversion(eligible)
      return eligible
    } catch (error) {
      console.error('❌ [USE_GUEST_CONVERSION] Eligibility check failed:', error)
      return false
    }
  }, [guestSessionData])

  const getInteractionCount = useCallback((): number => {
    return guestSessionData?.interactionCount || 0
  }, [guestSessionData])

  const getConversionAttempts = useCallback((): number => {
    return guestSessionData?.conversionAttempts || 0
  }, [guestSessionData])

  return {
    // State
    guestSessionData,
    isEligibleForConversion,
    shouldShowPrompt,
    isConverting,
    conversionError,

    // Actions
    triggerConversionPrompt,
    dismissPrompt,
    skipConversion,
    convertToAuth,
    checkEligibility,

    // Utils
    getInteractionCount,
    getConversionAttempts
  }
}
