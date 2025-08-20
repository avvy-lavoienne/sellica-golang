"use client"

import type React from "react"

import Image from "next/image"
import Compressor from "compressorjs"
import { toast } from "react-toastify"
import { Camera } from "lucide-react"

interface ProfileAvatarProps {
  avatarPreview: string | null
  avatarUrl: string | null
  isEditing: boolean
  onAvatarChange: (compressedFile: File, previewUrl: string) => void
}

export default function ProfileAvatar({ avatarPreview, avatarUrl, isEditing, onAvatarChange }: ProfileAvatarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const maxSizeInMB = 2
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024
      if (file.size > maxSizeInBytes) {
        toast.error(`Ukuran file terlalu besar, maksimal ${maxSizeInMB} MB`)
        return
      }

      new Compressor(file, {
        quality: 0.8,
        maxWidth: 300,
        maxHeight: 300,
        success(compressedResult) {
          const compressedFile = new File([compressedResult], file.name, {
            type: compressedResult.type,
            lastModified: Date.now(),
          })
          const previewUrl = URL.createObjectURL(compressedFile)
          onAvatarChange(compressedFile, previewUrl)
        },
        error(err) {
          console.error("Compression error:", err)
          toast.error("Gagal mengompresi gambar. Silakan coba lagi.")
        },
      })
    }
  }

  const currentAvatar = avatarPreview || avatarUrl

  return (
    <div className="flex justify-center my-6">
      <div className="relative">
        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
          {currentAvatar ? (
            <Image
              src={currentAvatar || "/placeholder.svg"}
              alt="Foto Profil"
              width={112}
              height={112}
              className="w-full h-full object-cover"
              unoptimized
              priority
              onError={(e) => {
                e.currentTarget.src = "/images/default-avatar.png"
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <span className="text-3xl">👤</span>
            </div>
          )}
        </div>

        {isEditing && (
          <label
            className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 cursor-pointer shadow-md transition-all duration-200"
            title="Unggah Foto Profil"
          >
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleChange} />
            <Camera className="h-4 w-4" />
          </label>
        )}
      </div>
    </div>
  )
}
