'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Loader } from 'lucide-react'
import Compressor from 'compressorjs'

import ProfileAvatar from './ProfileAvatar'
import ProfileForm from './ProfileForm'
import ProfileActions from './ProfileActions'
import { profileAPI, useProfileAPI, type Profile } from '@/lib/api/profile'

/**
 * ProfileSection Component
 * 
 * Manages profile display and editing using Go backend API
 * Replaces direct Supabase integration with service-oriented backend approach
 */
export default function ProfileSection() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    nip: '',
    position: '',
    nik: '',
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { updateToken } = useProfileAPI()

  /**
   * Load profile data on mount
   */
  useEffect(() => {
    loadProfile()
  }, [])

  /**
   * Update session token when auth changes
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('session')
      if (session) {
        try {
          const parsed = JSON.parse(session)
          updateToken(parsed.access_token)
        } catch (error) {
          console.warn('Failed to parse session:', error)
        }
      }
    }
  }, [updateToken])

  /**
   * Load profile from backend
   */
  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await profileAPI.getProfile()
      setProfile(data)
      
      // Initialize form with profile data
      setFormData({
        name: data.name || '',
        nip: data.nip || '',
        position: data.position || '',
        nik: data.nik || '',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memuat profil'
      setError(message)
      toast.error(message)
      console.error('Failed to load profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle avatar change (compress and prepare for upload)
   */
  const handleAvatarChange = (compressedFile: File, previewUrl: string) => {
    setCompressedFile(compressedFile)
    setAvatarPreview(previewUrl)
  }

  /**
   * Upload avatar to backend
   */
  const uploadAvatar = async () => {
    if (!compressedFile) {
      toast.error('File tidak dipilih')
      return
    }

    try {
      toast.loading('Mengunggah avatar...')
      const response = await profileAPI.uploadAvatar(compressedFile)
      
      // Update profile with new avatar URL
      if (profile) {
        setProfile({
          ...profile,
          avatar_url: response.url,
        })
      }

      setAvatarPreview(null)
      setCompressedFile(null)
      
      toast.dismiss()
      toast.success('Avatar berhasil diperbarui')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah avatar'
      toast.dismiss()
      toast.error(message)
      console.error('Failed to upload avatar:', err)
    }
  }

  /**
   * Delete avatar
   */
  const deleteAvatar = async () => {
    if (!profile?.avatar_url) {
      toast.error('Tidak ada avatar yang dihapus')
      return
    }

    try {
      toast.loading('Menghapus avatar...')
      await profileAPI.deleteAvatar()
      
      setProfile({
        ...profile!,
        avatar_url: null,
      })

      setAvatarPreview(null)
      setCompressedFile(null)
      
      toast.dismiss()
      toast.success('Avatar berhasil dihapus')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus avatar'
      toast.dismiss()
      toast.error(message)
      console.error('Failed to delete avatar:', err)
    }
  }

  /**
   * Save profile changes
   */
  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Upload avatar first if changed
      if (compressedFile) {
        await uploadAvatar()
      }

      // Update profile
      const updated = await profileAPI.updateProfile({
        name: formData.name,
        nip: formData.nip,
        position: formData.position,
      })

      setProfile(updated)
      setIsEditing(false)
      
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan profil'
      toast.error(message)
      console.error('Failed to save profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setIsEditing(false)
    setAvatarPreview(null)
    setCompressedFile(null)
    
    // Reset form to profile data
    if (profile) {
      setFormData({
        name: profile.name || '',
        nip: profile.nip || '',
        position: profile.position || '',
        nik: profile.nik || '',
      })
    }
  }

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat profil...</p>
      </div>
    )
  }

  /**
   * Error state
   */
  if (error && !profile) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-700 dark:text-red-200">
        <p className="font-semibold">Gagal memuat profil</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={loadProfile}
          className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  /**
   * Profile display
   */
  return (
    <div className="w-full max-w-2xl mx-auto">
      {profile && (
        <>
          {/* Avatar Section */}
          <ProfileAvatar
            avatarPreview={avatarPreview}
            avatarUrl={profile.avatar_url ?? null}
            isEditing={isEditing}
            onAvatarChange={handleAvatarChange}
          />

          {/* Profile Form */}
          <ProfileForm
            isEditing={isEditing}
            formData={formData}
            setFormData={setFormData}
            profile={{
              name: profile.name,
              nip: profile.nip,
              position: profile.position,
              nik: profile.nik ?? '',
              avatar_url: profile.avatar_url ?? null,
            }}
          />

          {/* Action Buttons */}
          <ProfileActions
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={handleCancel}
            onDeleteAvatar={deleteAvatar}
            hasAvatar={!!profile.avatar_url}
          />
        </>
      )}
    </div>
  )
}
