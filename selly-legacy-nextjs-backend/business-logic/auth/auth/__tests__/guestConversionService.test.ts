/**
 * Guest Conversion Service Tests
 * Tests for the guest-to-auth conversion business logic
 */

import { jest } from '@jest/globals'
import { GuestConversionService } from '../guestConversionService'
import { GuestSessionData, UserRegistrationData } from '@/components/auth/types'

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn(),
    admin: {
      deleteUser: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    insert: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/conn/supabaseClient', () => ({
  supabase: mockSupabase,
}))

// Mock session manager
const mockSessionManager = {
  getInstance: jest.fn(),
  getSession: jest.fn(),
  createSession: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
}

jest.mock('@/services/session/unifiedSessionManager', () => ({
  UnifiedSessionManager: mockSessionManager,
}))

const mockGuestSessionData: GuestSessionData = {
  sessionId: 'guest-session-123',
  guestUuid: 'guest-uuid-456',
  conversationHistory: [
    {
      id: '1',
      query: 'Test query',
      response: 'Test response',
      timestamp: new Date(),
    },
  ],
  userPreferences: {
    language: 'id',
    theme: 'auto',
    dataFormat: 'summary',
    verbosity: 'detailed',
    notifications: true,
  },
  createdAt: new Date('2024-01-01'),
  lastAccessedAt: new Date(),
  interactionCount: 5,
  conversionEligible: true,
  conversionAttempts: 0,
}

const mockUserData: UserRegistrationData = {
  email: 'test@example.com',
  password: 'TestPassword123',
  confirmPassword: 'TestPassword123',
  name: 'Test User',
  nik: '1234567890123456',
  nip: '123456789012345678',
  position: 'Test Position',
  agreeToTerms: true,
  agreeToPrivacy: true,
}

describe('GuestConversionService', () => {
  let conversionService: GuestConversionService

  beforeEach(() => {
    jest.clearAllMocks()
    conversionService = GuestConversionService.getInstance()
    
    // Setup default mocks
    mockSessionManager.getInstance.mockReturnValue(mockSessionManager)
  })

  describe('convertGuestToAuth', () => {
    test('successfully converts guest to authenticated user', async () => {
      // Mock successful Supabase signup
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      })

      // Mock successful profile creation
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      // Mock session operations
      mockSessionManager.getSession.mockResolvedValue({
        id: 'guest-session-123',
        type: 'guest',
        conversationHistory: mockGuestSessionData.conversationHistory,
        userPreferences: mockGuestSessionData.userPreferences,
      })

      mockSessionManager.createSession.mockResolvedValue({
        id: 'auth-session-456',
        type: 'authenticated',
      })

      mockSessionManager.deleteSession.mockResolvedValue(undefined)

      const result = await conversionService.convertGuestToAuth(
        mockGuestSessionData,
        mockUserData
      )

      expect(result.success).toBe(true)
      expect(result.userId).toBe('user-123')
      expect(result.sessionId).toBe('auth-session-456')
      expect(result.migratedData?.conversationCount).toBe(1)
      expect(result.migratedData?.preferencesTransferred).toBe(true)
      expect(result.migratedData?.sessionContinuity).toBe(true)

      // Verify Supabase calls
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: mockUserData.email,
        password: mockUserData.password,
        options: {
          data: {
            name: mockUserData.name,
            nik: mockUserData.nik,
            nip: mockUserData.nip,
            position: mockUserData.position,
          },
        },
      })

      expect(mockInsert).toHaveBeenCalledWith({
        id: 'user-123',
        name: mockUserData.name,
        nik: mockUserData.nik,
        nip: mockUserData.nip,
        position: mockUserData.position,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })

      // Verify session operations
      expect(mockSessionManager.createSession).toHaveBeenCalledWith('authenticated', {
        userId: 'user-123',
        userEmail: 'test@example.com',
        initialContext: {
          conversationHistory: mockGuestSessionData.conversationHistory,
          userPreferences: mockGuestSessionData.userPreferences,
        },
      })

      expect(mockSessionManager.deleteSession).toHaveBeenCalledWith('guest-session-123')
    })

    test('handles Supabase signup error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      })

      const result = await conversionService.convertGuestToAuth(
        mockGuestSessionData,
        mockUserData
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email sudah terdaftar')
    })

    test('handles profile creation error and cleans up user', async () => {
      // Mock successful signup
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      })

      // Mock profile creation error
      const mockInsert = jest.fn().mockResolvedValue({
        error: { message: 'Profile creation failed' },
      })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      const result = await conversionService.convertGuestToAuth(
        mockGuestSessionData,
        mockUserData
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to create profile')

      // Should cleanup the created user
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
    })

    test('handles session migration failure gracefully', async () => {
      // Mock successful user creation
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      })

      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      })

      // Mock session migration failure
      mockSessionManager.getSession.mockResolvedValue(null)
      mockSessionManager.createSession.mockResolvedValue({
        id: 'auth-session-456',
        type: 'authenticated',
      })

      const result = await conversionService.convertGuestToAuth(
        mockGuestSessionData,
        mockUserData
      )

      // Should still succeed even if migration fails
      expect(result.success).toBe(true)
      expect(result.userId).toBe('user-123')
    })
  })

  describe('isConversionEligible', () => {
    test('returns true for eligible guest session', async () => {
      const eligible = await conversionService.isConversionEligible(mockGuestSessionData)
      expect(eligible).toBe(true)
    })

    test('returns false for insufficient interactions', async () => {
      const ineligibleData = {
        ...mockGuestSessionData,
        interactionCount: 2,
      }

      const eligible = await conversionService.isConversionEligible(ineligibleData)
      expect(eligible).toBe(false)
    })

    test('returns false for expired session', async () => {
      const expiredData = {
        ...mockGuestSessionData,
        createdAt: new Date('2023-01-01'), // More than 7 days ago
      }

      const eligible = await conversionService.isConversionEligible(expiredData)
      expect(eligible).toBe(false)
    })

    test('returns false for too many conversion attempts', async () => {
      const attemptedData = {
        ...mockGuestSessionData,
        conversionAttempts: 3,
      }

      const eligible = await conversionService.isConversionEligible(attemptedData)
      expect(eligible).toBe(false)
    })
  })

  describe('trackConversionAttempt', () => {
    test('increments conversion attempts', async () => {
      const mockSession = {
        id: 'guest-session-123',
        type: 'guest',
        conversionAttempts: 1,
      }

      mockSessionManager.getSession.mockResolvedValue(mockSession)
      mockSessionManager.updateSession.mockResolvedValue(undefined)

      await conversionService.trackConversionAttempt('guest-session-123')

      expect(mockSessionManager.updateSession).toHaveBeenCalledWith('guest-session-123', {
        conversionAttempts: 2,
      })
    })

    test('handles missing session gracefully', async () => {
      mockSessionManager.getSession.mockResolvedValue(null)

      // Should not throw error
      await expect(
        conversionService.trackConversionAttempt('non-existent-session')
      ).resolves.toBeUndefined()
    })
  })

  describe('Error Translation', () => {
    test('translates common Supabase errors to Indonesian', async () => {
      const errorCases = [
        { english: 'User already registered', indonesian: 'Email sudah terdaftar' },
        { english: 'Invalid email', indonesian: 'Format email tidak valid' },
        { english: 'Password should be at least 6 characters', indonesian: 'Password minimal 6 karakter' },
      ]

      for (const { english, indonesian } of errorCases) {
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: null },
          error: { message: english },
        })

        const result = await conversionService.convertGuestToAuth(
          mockGuestSessionData,
          mockUserData
        )

        expect(result.error).toBe(indonesian)
      }
    })

    test('provides fallback error message for unknown errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Unknown error from server' },
      })

      const result = await conversionService.convertGuestToAuth(
        mockGuestSessionData,
        mockUserData
      )

      expect(result.error).toBe('Terjadi kesalahan, silakan coba lagi')
    })
  })

  describe('Singleton Pattern', () => {
    test('returns same instance', () => {
      const instance1 = GuestConversionService.getInstance()
      const instance2 = GuestConversionService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })
})
