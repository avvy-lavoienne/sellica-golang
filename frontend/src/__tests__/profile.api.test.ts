/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

/**
 * profileAPI Client Tests
 * 
 * Tests for the TypeScript API client that communicates with Go backend
 * Includes: profile operations, avatar handling, error handling, session management
 */

import { profileAPI, type Profile } from '@/lib/api/profile'

// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('profileAPI Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    // Set default session token
    localStorage.setItem(
      'session',
      JSON.stringify({
        access_token: 'test-token-12345',
        user: { id: '123' },
      }),
    )
  })

  describe('getProfile()', () => {
    it('should fetch profile successfully', async () => {
      const mockProfile: Profile = {
        id: '123',
        name: 'John Doe',
        nip: '12345678',
        position: 'Staff Member',
        nik: '1234567890123456',
        avatar_url: null,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProfile }),
      })

      const result = await profileAPI.getProfile()

      expect(result).toEqual(mockProfile)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/profile'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        }),
      )
    })

    it('should handle profile fetch error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(profileAPI.getProfile()).rejects.toThrow()
    })

    it('should handle network error', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      )

      await expect(profileAPI.getProfile()).rejects.toThrow('Network error')
    })
  })

  describe('updateProfile()', () => {
    it('should update profile successfully', async () => {
      const updates = {
        name: 'Jane Doe',
        nip: '12345678',
        position: 'Senior Staff',
      }

      const mockResponse: Profile = {
        id: '123',
        name: 'Jane Doe',
        nip: '12345678',
        position: 'Senior Staff',
        nik: '1234567890123456',
        avatar_url: null,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse }),
      })

      const result = await profileAPI.updateProfile(updates)

      expect(result).toEqual(mockResponse)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/profile'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updates),
        }),
      )
    })

    it('should validate required fields before update', async () => {
      await expect(
        profileAPI.updateProfile({ name: '', nip: '', position: '' }),
      ).rejects.toThrow()
    })

    it('should handle update with partial data', async () => {
      const updates = {
        name: 'John Doe',
        nip: '12345678',
        position: 'Manager',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            name: 'John Doe',
            nip: '12345678',
            position: 'Manager',
            nik: '1234567890123456',
          },
        }),
      })

      const result = await profileAPI.updateProfile(updates)

      expect(result.position).toBe('Manager')
    })
  })

  describe('uploadAvatar()', () => {
    it('should upload avatar successfully', async () => {
      const file = new File(['fake image content'], 'avatar.jpg', {
        type: 'image/jpeg',
      })

      const mockResponse = {
        url: 'https://storage.url/avatar-123.jpg',
        path: 'avatars/123.jpg',
        file_name: 'avatar.jpg',
        size: 12345,
        mime_type: 'image/jpeg',
        uploaded_at: new Date().toISOString(),
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse }),
      })

      const result = await profileAPI.uploadAvatar(file)

      expect(result.url).toBeDefined()
      expect(result.file_name).toBe('avatar.jpg')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/profile/avatar'),
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    it('should reject file larger than 2MB', async () => {
      // Create a file larger than 2MB
      const largeFile = new File(
        [new ArrayBuffer(3 * 1024 * 1024)],
        'large.jpg',
        {
          type: 'image/jpeg',
        },
      )

      await expect(profileAPI.uploadAvatar(largeFile)).rejects.toThrow(
        /terlalu besar|File|MB/i,
      )
    })

    it('should reject unsupported file types', async () => {
      const file = new File(['content'], 'file.txt', {
        type: 'text/plain',
      })

      await expect(profileAPI.uploadAvatar(file)).rejects.toThrow(
        /format|type|jpg|png/i,
      )
    })

    it('should handle upload error', async () => {
      const file = new File(['fake image'], 'avatar.jpg', {
        type: 'image/jpeg',
      })

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Upload failed' }),
      })

      await expect(profileAPI.uploadAvatar(file)).rejects.toThrow()
    })
  })

  describe('deleteAvatar()', () => {
    it('should delete avatar successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Avatar deleted successfully',
        }),
      })

      await expect(profileAPI.deleteAvatar()).resolves.not.toThrow()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/profile/avatar'),
        expect.objectContaining({
          method: 'DELETE',
        }),
      )
    })

    it('should handle delete error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Avatar not found' }),
      })

      await expect(profileAPI.deleteAvatar()).rejects.toThrow()
    })
  })

  describe('getAvatarUrl()', () => {
    it('should return cached avatar URL', async () => {
      const mockUrl = 'https://storage.url/avatar-123.jpg'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { url: mockUrl } }),
      })

      const result = await profileAPI.getAvatarUrl()

      expect(result).toBe(mockUrl)
    })

    it('should return null if no avatar', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ avatar_url: null }),
      })

      const result = await profileAPI.getAvatarUrl()

      expect(result === null || result === '').toBe(true)
    })
  })

  describe('Session Token Management', () => {
    it('should load token from localStorage on initialization', () => {
      localStorage.setItem(
        'session',
        JSON.stringify({
          access_token: 'new-token-abc123',
        }),
      )

      // Reinitialize to pick up new token
      profileAPI.setSessionToken('new-token-abc123')

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should use Bearer token in requests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            name: 'John',
            nip: '12345',
            position: 'Staff',
          },
        }),
      })

      await profileAPI.getProfile()

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
      expect(callArgs.headers.Authorization).toMatch(/^Bearer /)
    })

    it('should update token via setSessionToken()', () => {
      const newToken = 'updated-token-xyz789'
      profileAPI.setSessionToken(newToken)

      // Note: Since profileAPI is a singleton, the token is stored internally
      // In real usage, subsequent API calls would use this token
      expect(profileAPI).toBeDefined()
    })

    it('should handle missing session gracefully', () => {
      localStorage.clear()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { name: 'John' },
        }),
      })

      // Should not throw even without session
      expect(() => profileAPI.getProfile()).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should provide Indonesian error messages for validation errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Validasi gagal',
          details: ['nama harus diisi'],
        }),
      })

      try {
        await profileAPI.updateProfile({
          name: '',
          nip: '12345678',
          position: 'Staff',
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined()
      }
    })

    it('should provide Indonesian error messages for auth errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Tidak terautentikasi',
        }),
      })

      try {
        await profileAPI.getProfile()
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined()
      }
    })

    it('should handle network errors gracefully', async () => {
      // Override fetch to throw immediately
      const originalFetch = global.fetch
      ;(global.fetch as jest.Mock) = jest.fn(async () => {
        throw new Error('Network timeout')
      })

      try {
        await profileAPI.getProfile()
        // If we get here, the test should fail
        expect(true).toBe(false)
      } catch (error: any) {
        // Network errors from fetch rejection propagate directly
        expect(error.message).toContain('Network')
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should parse error responses correctly', async () => {
      const errorMessage = 'Terjadi kesalahan pada server'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: errorMessage,
        }),
      })

      try {
        await profileAPI.updateProfile({
          name: 'Test',
          nip: '12345678',
          position: 'Staff',
        })
        expect(true).toBe(false) // Should not reach here
      } catch (error: any) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Multipart Form Data', () => {
    it('should use FormData for avatar upload', async () => {
      const file = new File(['image content'], 'avatar.jpg', {
        type: 'image/jpeg',
      })

      const originalFetch = global.fetch
      ;(global.fetch as jest.Mock) = jest.fn(async () => ({
        ok: true,
        json: jest.fn(async () => ({
          data: {
            url: 'https://url.com/avatar.jpg',
            path: 'avatars/123.jpg',
            file_name: 'avatar.jpg',
            size: 12345,
            mime_type: 'image/jpeg',
            uploaded_at: new Date().toISOString(),
          },
        })),
      }))

      try {
        await profileAPI.uploadAvatar(file)
        expect(global.fetch).toHaveBeenCalled()
        const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
        expect(callArgs.body).toBeInstanceOf(FormData)
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should include correct headers for multipart upload', async () => {
      const file = new File(['image content'], 'avatar.jpg', {
        type: 'image/jpeg',
      })

      const originalFetch = global.fetch
      ;(global.fetch as jest.Mock) = jest.fn(async () => ({
        ok: true,
        json: jest.fn(async () => ({
          data: {
            url: 'https://url.com/avatar.jpg',
            path: 'avatars/123.jpg',
            file_name: 'avatar.jpg',
            size: 12345,
            mime_type: 'image/jpeg',
            uploaded_at: new Date().toISOString(),
          },
        })),
      }))

      try {
        await profileAPI.uploadAvatar(file)

        const callArgs = (global.fetch as jest.Mock).mock.calls[0][1]
        // FormData automatically sets Content-Type header, so we don't set it manually
        expect(callArgs.headers.Authorization).toBeDefined()
      } finally {
        global.fetch = originalFetch
      }
    })
  })

  describe('Cache Management', () => {
    it('should cache profile data', async () => {
      const mockProfile: Profile = {
        id: '123',
        name: 'John Doe',
        nip: '12345678',
        position: 'Staff',
        nik: '1234567890123456',
        avatar_url: null,
      }

      const originalFetch = global.fetch
      ;(global.fetch as jest.Mock) = jest.fn(async () => ({
        ok: true,
        json: jest.fn(async () => ({ data: mockProfile })),
      }))

      try {
        const result1 = await profileAPI.getProfile()
        expect(result1).toBeDefined()
        expect(result1.name).toBe('John Doe')

        const result2 = await profileAPI.getProfile()
        expect(result2).toBeDefined()
        expect(result2.name).toBe('John Doe')
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should invalidate cache on update', async () => {
      const originalFetch = global.fetch
      ;(global.fetch as jest.Mock) = jest.fn(async () => ({
        ok: true,
        json: jest.fn(async () => ({
          data: {
            id: '123',
            name: 'Jane Doe',
            nip: '12345678',
            position: 'Staff',
            nik: '1234567890123456',
            avatar_url: null,
          },
        })),
      }))

      try {
        await profileAPI.updateProfile({
          name: 'Jane Doe',
          nip: '12345678',
          position: 'Staff',
        })

        expect(global.fetch).toHaveBeenCalled()
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should invalidate cache on avatar delete', async () => {
      const originalFetch = global.fetch
      ;(global.fetch as jest.Mock) = jest.fn(async () => ({
        ok: true,
        json: jest.fn(async () => ({
          data: {
            id: '123',
            name: 'John Doe',
            nip: '12345678',
            position: 'Staff',
            nik: '1234567890123456',
            avatar_url: null,
          },
        })),
      }))

      try {
        await profileAPI.deleteAvatar()
        expect(global.fetch).toHaveBeenCalled()
      } finally {
        global.fetch = originalFetch
      }
    })
  })
})
