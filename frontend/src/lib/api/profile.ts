/**
 * Profile API Client
 * 
 * Provides TypeScript client for profile management operations
 * Communicates with Go backend API endpoints
 * 
 * API Base: /api/v1/profile
 * Service Account: Uses Go backend with service role JWT for Supabase bypass
 */

/**
 * Profile data structure matching backend ProfileData
 */
export interface Profile {
  id: string
  name: string
  nip: string
  position: string
  avatar_url?: string | null
  nik?: string
  role?: string
  email?: string
  updated_at?: string
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  name: string
  nip: string
  position: string
}

/**
 * Avatar upload response
 */
export interface AvatarUploadResponse {
  url: string
  path: string
  file_name: string
  size: number
  mime_type: string
  uploaded_at: string
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string
  message: string
  code?: string
  status_code?: number
}

/**
 * Profile API Client Class
 * 
 * Handles all profile-related API calls to Go backend
 */
export class ProfileAPI {
  private baseURL: string
  private sessionToken: string | null = null

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') {
    this.baseURL = baseURL.replace(/\/$/, '') // Remove trailing slash
    this.loadSessionToken()
  }

  /**
   * Load session token from localStorage
   */
  private loadSessionToken(): void {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('session')
      if (session) {
        try {
          const parsed = JSON.parse(session)
          this.sessionToken = parsed.access_token
        } catch (error) {
          console.warn('Failed to parse session from localStorage:', error)
        }
      }
    }
  }

  /**
   * Update session token (called after login)
   */
  public setSessionToken(token: string): void {
    this.sessionToken = token
  }

  /**
   * Build headers with authentication
   */
  private getHeaders(includeContentType: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.sessionToken || ''}`,
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: Partial<ApiErrorResponse> = {
      error: 'unknown_error',
      message: 'Terjadi kesalahan. Silakan coba lagi',
    }

    try {
      const json = await response.json()
      errorData = json
    } catch (error) {
      console.warn('Failed to parse error response:', error)
    }

    const userMessage = errorData.message || 'Terjadi kesalahan. Silakan coba lagi'
    const error = new Error(userMessage)
    Object.assign(error, {
      code: errorData.error,
      statusCode: response.status,
      originalMessage: errorData.message,
    })

    throw error
  }

  /**
   * Get user profile
   * 
   * @returns Profile data
   * @throws Error with user-friendly Indonesian message
   * 
   * @example
   * try {
   *   const profile = await profileAPI.getProfile()
   *   console.log(`${profile.name} (${profile.position})`)
   * } catch (error) {
   *   console.error(error.message) // Indonesian error message
   * }
   */
  public async getProfile(): Promise<Profile> {
    const response = await fetch(`${this.baseURL}/api/v1/profile`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      return this.handleError(response)
    }

    const data = await response.json()
    return data.data as Profile
  }

  /**
   * Update user profile
   * 
   * @param updates - Profile fields to update
   * @returns Updated profile data
   * @throws Error with user-friendly Indonesian message
   * 
   * @example
   * try {
   *   const updated = await profileAPI.updateProfile({
   *     name: 'John Doe',
   *     nip: '123456789',
   *     position: 'Software Engineer'
   *   })
   *   console.log('Profile updated successfully')
   * } catch (error) {
   *   console.error(error.message) // Indonesian error message
   * }
   */
  public async updateProfile(updates: UpdateProfileRequest): Promise<Profile> {
    // Validate input
    if (!updates.name?.trim()) {
      throw new Error('Nama harus diisi')
    }
    if (updates.name.length < 2) {
      throw new Error('Nama minimal 2 karakter')
    }
    if (updates.name.length > 255) {
      throw new Error('Nama maksimal 255 karakter')
    }

    if (!updates.nip?.trim()) {
      throw new Error('NIP harus diisi')
    }
    if (updates.nip.length > 50) {
      throw new Error('NIP maksimal 50 karakter')
    }

    if (!updates.position?.trim()) {
      throw new Error('Posisi harus diisi')
    }
    if (updates.position.length < 2) {
      throw new Error('Posisi minimal 2 karakter')
    }
    if (updates.position.length > 255) {
      throw new Error('Posisi maksimal 255 karakter')
    }

    const response = await fetch(`${this.baseURL}/api/v1/profile`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      return this.handleError(response)
    }

    const data = await response.json()
    return data.data as Profile
  }

  /**
   * Upload avatar
   * 
   * @param file - Image file to upload
   * @returns Upload response with public URL
   * @throws Error with user-friendly Indonesian message
   * 
   * Validation:
   * - File size: max 2 MB
   * - Format: JPEG or PNG only
   * 
   * @example
   * try {
   *   const input = document.querySelector('input[type="file"]')
   *   const file = input.files[0]
   *   
   *   const response = await profileAPI.uploadAvatar(file)
   *   console.log(`Avatar uploaded: ${response.url}`)
   *   
   *   // Update profile display with new URL
   *   setAvatarUrl(response.url)
   * } catch (error) {
   *   console.error(error.message) // Indonesian error message
   * }
   */
  public async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    // Validate file
    if (!file) {
      throw new Error('File harus dipilih')
    }

    const maxSize = 2 * 1024 * 1024 // 2 MB
    if (file.size > maxSize) {
      throw new Error(`File terlalu besar (maks ${maxSize / (1024 * 1024)} MB)`)
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Format file harus JPG atau PNG')
    }

    // Upload using multipart form data
    const formData = new FormData()
    formData.append('avatar', file, file.name)

    const response = await fetch(`${this.baseURL}/api/v1/profile/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.sessionToken || ''}`,
      },
      credentials: 'include',
      body: formData,
    })

    if (!response.ok) {
      return this.handleError(response)
    }

    const data = await response.json()
    return data.data as AvatarUploadResponse
  }

  /**
   * Delete avatar
   * 
   * @returns Void on success
   * @throws Error with user-friendly Indonesian message
   * 
   * @example
   * try {
   *   await profileAPI.deleteAvatar()
   *   console.log('Avatar deleted successfully')
   *   setAvatarUrl(null)
   * } catch (error) {
   *   console.error(error.message) // Indonesian error message
   * }
   */
  public async deleteAvatar(): Promise<void> {
    const response = await fetch(`${this.baseURL}/api/v1/profile/avatar`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      return this.handleError(response)
    }
  }

  /**
   * Get avatar URL
   * 
   * @returns Avatar URL or empty string if not set
   * @throws Error with user-friendly Indonesian message
   * 
   * @example
   * const url = await profileAPI.getAvatarUrl()
   * if (url) {
   *   setAvatarUrl(url)
   * }
   */
  public async getAvatarUrl(): Promise<string> {
    const response = await fetch(`${this.baseURL}/api/v1/profile/avatar`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      return this.handleError(response)
    }

    const data = await response.json()
    return data.data?.url || ''
  }
}

// Create singleton instance
export const profileAPI = new ProfileAPI()

/**
 * Hook to update session token when auth changes
 * 
 * @example
 * import { useEffect } from 'react'
 * import { profileAPI, useProfileAPI } from '@/lib/api/profile'
 * 
 * export function MyComponent() {
 *   const { updateToken } = useProfileAPI()
 *   
 *   useEffect(() => {
   *     // Update token when auth session changes
   *     const session = localStorage.getItem('session')
   *     if (session) {
   *       updateToken(JSON.parse(session).access_token)
   *     }
   *   }, [])
   * }
 */
export function useProfileAPI() {
  return {
    updateToken: (token: string) => profileAPI.setSessionToken(token),
  }
}
