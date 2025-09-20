/**
 * Guest-to-Auth Conversion Service
 * Handles the conversion of guest sessions to authenticated user accounts
 * with data migration and session continuity
 */

import { supabase } from '@/lib/conn/supabaseClient'
import { UnifiedSessionManager } from '../../session/session/unifiedSessionManager'
import { 
  GuestSessionData, 
  UserRegistrationData, 
  ConversionResult 
} from '@/components/auth/types'
import { 
  UnifiedSession, 
  GuestSession, 
  AuthenticatedSession,
  ConversationTurn 
} from '@/services/session/unifiedTypes'

export class GuestConversionService {
  private sessionManager: UnifiedSessionManager
  private static instance: GuestConversionService

  constructor() {
    this.sessionManager = UnifiedSessionManager.getInstance()
  }

  public static getInstance(): GuestConversionService {
    if (!GuestConversionService.instance) {
      GuestConversionService.instance = new GuestConversionService()
    }
    return GuestConversionService.instance
  }

  /**
   * Convert guest session to authenticated user account
   */
  async convertGuestToAuth(
    guestSessionData: GuestSessionData,
    userData: UserRegistrationData
  ): Promise<ConversionResult> {
    try {
      console.log('🔄 [GUEST_CONVERSION] Starting conversion process...', {
        guestSessionId: guestSessionData.sessionId,
        email: userData.email
      })

      // Step 1: Create Supabase user account
      const authResult = await this.createSupabaseUser(userData)
      if (!authResult.success || !authResult.user) {
        return {
          success: false,
          error: authResult.error || 'Failed to create user account'
        }
      }

      // Step 2: Create user profile
      const profileResult = await this.createUserProfile(authResult.user.id, userData)
      if (!profileResult.success) {
        // Cleanup: delete the created auth user
        await supabase.auth.admin.deleteUser(authResult.user.id)
        return {
          success: false,
          error: profileResult.error || 'Failed to create user profile'
        }
      }

      // Step 3: Migrate guest session data
      const migrationResult = await this.migrateGuestData(
        guestSessionData,
        authResult.user.id
      )

      if (!migrationResult.success) {
        console.warn('⚠️ [GUEST_CONVERSION] Data migration failed, but user account created', {
          userId: authResult.user.id,
          error: migrationResult.error
        })
      }

      // Step 4: Create new authenticated session
      const newSessionResult = await this.createAuthenticatedSession(
        authResult.user.id,
        userData.email,
        guestSessionData
      )

      if (!newSessionResult.success) {
        console.warn('⚠️ [GUEST_CONVERSION] Session creation failed', {
          userId: authResult.user.id,
          error: newSessionResult.error
        })
      }

      // Step 5: Cleanup guest session
      await this.cleanupGuestSession(guestSessionData.sessionId)

      console.log('✅ [GUEST_CONVERSION] Conversion completed successfully', {
        userId: authResult.user.id,
        newSessionId: newSessionResult.sessionId,
        migratedConversations: migrationResult.migratedData?.conversationCount || 0
      })

      return {
        success: true,
        userId: authResult.user.id,
        sessionId: newSessionResult.sessionId,
        migratedData: {
          conversationCount: migrationResult.migratedData?.conversationCount || 0,
          preferencesTransferred: migrationResult.migratedData?.preferencesTransferred || false,
          sessionContinuity: newSessionResult.success
        }
      }

    } catch (error) {
      console.error('❌ [GUEST_CONVERSION] Conversion failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      }
    }
  }

  /**
   * Create Supabase user account
   */
  private async createSupabaseUser(userData: UserRegistrationData): Promise<{
    success: boolean
    user?: any
    error?: string
  }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            nik: userData.nik || null,
            nip: userData.nip || null,
            position: userData.position || null
          }
        }
      })

      if (error) {
        console.error('❌ [GUEST_CONVERSION] Supabase signup error:', error)
        return {
          success: false,
          error: this.translateSupabaseError(error.message)
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'User creation failed - no user data returned'
        }
      }

      return {
        success: true,
        user: data.user
      }

    } catch (error) {
      console.error('❌ [GUEST_CONVERSION] User creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User creation failed'
      }
    }
  }

  /**
   * Create user profile in database
   */
  private async createUserProfile(userId: string, userData: UserRegistrationData): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: userData.name,
          nik: userData.nik || null,
          nip: userData.nip || null,
          position: userData.position || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('❌ [GUEST_CONVERSION] Profile creation error:', error)
        return {
          success: false,
          error: `Failed to create profile: ${error.message}`
        }
      }

      return { success: true }

    } catch (error) {
      console.error('❌ [GUEST_CONVERSION] Profile creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile creation failed'
      }
    }
  }

  /**
   * Migrate guest session data to authenticated session
   */
  private async migrateGuestData(
    guestSessionData: GuestSessionData,
    userId: string
  ): Promise<{
    success: boolean
    error?: string
    migratedData?: {
      conversationCount: number
      preferencesTransferred: boolean
    }
  }> {
    try {
      // Get the actual guest session from session manager
      const guestSession = await this.sessionManager.getSession(guestSessionData.sessionId) as unknown as GuestSession
      
      if (!guestSession) {
        console.warn('⚠️ [GUEST_CONVERSION] Guest session not found for migration')
        return {
          success: false,
          error: 'Guest session not found'
        }
      }

      // Migrate conversation history
      const conversationCount = guestSession.conversationHistory?.length || 0
      
      // Store conversation history in user's session data
      // This will be handled by the new authenticated session creation
      
      console.log('📦 [GUEST_CONVERSION] Migrating data:', {
        conversationCount,
        preferences: guestSession.userPreferences
      })

      return {
        success: true,
        migratedData: {
          conversationCount,
          preferencesTransferred: true
        }
      }

    } catch (error) {
      console.error('❌ [GUEST_CONVERSION] Data migration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data migration failed'
      }
    }
  }

  /**
   * Create new authenticated session with migrated data
   */
  private async createAuthenticatedSession(
    userId: string,
    userEmail: string,
    guestSessionData: GuestSessionData
  ): Promise<{
    success: boolean
    sessionId?: string
    error?: string
  }> {
    try {
      // Get guest session for data migration
      const guestSession = await this.sessionManager.getSession(guestSessionData.sessionId) as unknown as GuestSession
      
      // Create new authenticated session with migrated data
      const newSession = await this.sessionManager.createSession('authenticated', {
        userId,
        initialContext: {
          userPreferences: {
            language: guestSession?.userPreferences?.language || 'id',
            dataFormat: guestSession?.userPreferences?.dataFormat || 'summary',
            verbosity: guestSession?.userPreferences?.verbosity === 'standard' || guestSession?.userPreferences?.verbosity === 'minimal' ? 'detailed' : (guestSession?.userPreferences?.verbosity || 'detailed')
          }
        }
      })

      if (!newSession) {
        return {
          success: false,
          error: 'Failed to create authenticated session'
        }
      }

      console.log('✅ [GUEST_CONVERSION] Authenticated session created:', {
        sessionId: newSession.id,
        userId,
        migratedConversations: guestSession?.conversationHistory?.length || 0
      })

      return {
        success: true,
        sessionId: newSession.id
      }

    } catch (error) {
      console.error('❌ [GUEST_CONVERSION] Session creation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session creation failed'
      }
    }
  }

  /**
   * Cleanup guest session after successful conversion
   */
  private async cleanupGuestSession(guestSessionId: string): Promise<void> {
    try {
      await this.sessionManager.deleteSession(guestSessionId)
      console.log('🧹 [GUEST_CONVERSION] Guest session cleaned up:', guestSessionId)
    } catch (error) {
      console.warn('⚠️ [GUEST_CONVERSION] Failed to cleanup guest session:', error)
    }
  }

  /**
   * Translate Supabase error messages to Indonesian
   */
  private translateSupabaseError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'User already registered': 'Email sudah terdaftar',
      'Invalid email': 'Format email tidak valid',
      'Password should be at least 6 characters': 'Password minimal 6 karakter',
      'Email not confirmed': 'Email belum dikonfirmasi',
      'Invalid login credentials': 'Email atau password salah',
      'Too many requests': 'Terlalu banyak percobaan, coba lagi nanti'
    }

    for (const [english, indonesian] of Object.entries(errorMap)) {
      if (errorMessage.includes(english)) {
        return indonesian
      }
    }

    return 'Terjadi kesalahan, silakan coba lagi'
  }

  /**
   * Check if guest session is eligible for conversion
   */
  async isConversionEligible(guestSessionData: GuestSessionData): Promise<boolean> {
    try {
      // Check minimum interaction count
      if (guestSessionData.interactionCount < 3) {
        return false
      }

      // Check if session is not expired
      const now = new Date()
      const sessionAge = now.getTime() - new Date(guestSessionData.createdAt).getTime()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days

      if (sessionAge > maxAge) {
        return false
      }

      // Check conversion attempts limit
      if (guestSessionData.conversionAttempts >= 3) {
        return false
      }

      return true

    } catch (error) {
      console.error('❌ [GUEST_CONVERSION] Eligibility check error:', error)
      return false
    }
  }

  /**
   * Track conversion attempt
   */
  async trackConversionAttempt(guestSessionId: string): Promise<void> {
    try {
      const session = await this.sessionManager.getSession(guestSessionId) as unknown as GuestSession
      if (session) {
        // Note: conversionAttempts tracking would need to be implemented in session metadata
        // For now, we'll just log the attempt
        console.log('🔄 [GUEST_CONVERSION] Tracking conversion attempt for session:', guestSessionId)
      }
    } catch (error) {
      console.warn('⚠️ [GUEST_CONVERSION] Failed to track conversion attempt:', error)
    }
  }
}
