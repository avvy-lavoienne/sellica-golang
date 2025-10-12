"use client"

import type React from "react"

import { useState } from "react"
import {
  UserIcon,
  FingerPrintIcon,
  PhotoIcon,
  UsersIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline"
import type { SalahRekamData, SalahRekamFormData } from "@/types/data-rekam/salah-rekam"
import { validateField, type SalahRekamFormValues } from "@/lib/validations/salah-rekam"
import FlowbiteInput from "@/components/ui/FlowbiteInput"

interface SalahRekamFormProps {
  formData: SalahRekamFormData
  setFormData: React.Dispatch<React.SetStateAction<SalahRekamFormData>>
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  loading: boolean
  isEditing: boolean
  editData: SalahRekamData | null
  userRole: string
}

export default function SalahRekamForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
}: SalahRekamFormProps) {
  const [activeSection, setActiveSection] = useState<string>("salahRekam")
  const [errors, setErrors] = useState<Partial<Record<keyof SalahRekamFormValues, string>>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (
      ["nik_salah_rekam", "nik_pemilik_biometric", "nik_pemilik_foto", "nik_petugas_rekam", "nik_pengaju"].includes(
        name,
      ) &&
      value &&
      !/^\d*$/.test(value)
    ) {
      return // Only allow digits for NIK fields
    }
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validate field on change
    const result = validateField(name as keyof SalahRekamFormValues, value)
    if (!result.success) {
      setErrors((prev) => ({
        ...prev,
        [name]: result.error.issues[0]?.message || "Invalid input",
      }))
    } else {
      // Clear error if validation passes
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof SalahRekamFormValues]
        return newErrors
      })
    }
  }

  const sections = [
    {
      id: "salahRekam",
      title: "Data Salah Rekam",
      icon: UserIcon,
    },
    {
      id: "biometric",
      title: "Pemilik Biometric",
      icon: FingerPrintIcon,
    },
    {
      id: "foto",
      title: "Pemilik Foto",
      icon: PhotoIcon,
    },
    {
      id: "petugas",
      title: "Petugas & Pengaju",
      icon: UsersIcon,
    },
    {
      id: "tanggal",
      title: "Detail Perekaman",
      icon: CalendarIcon,
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Flowbite Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
          {sections.map((section) => {
            const IconComponent = section.icon
            return (
              <li key={section.id} className="mr-2" role="presentation">
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group ${
                    activeSection === section.id
                      ? "text-primary-600 border-primary-600 dark:text-primary-500 dark:border-primary-500 active"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  type="button"
                  role="tab"
                  aria-selected={activeSection === section.id}
                  aria-controls={`${section.id}-content`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {section.title}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Data Salah Rekam Section */}
          {activeSection === "salahRekam" && (
            <div className="space-y-4" id="salahRekam-content" role="tabpanel">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                <span className="bg-primary-100 dark:bg-primary-900/30 p-1.5 rounded-md mr-2">
                  <UserIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </span>
                Data Salah Rekam
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FlowbiteInput
                  label="NIK Salah Rekam"
                  name="nik_salah_rekam"
                  value={formData.nik_salah_rekam || ""}
                  onChange={handleInputChange}
                  type="text"
                  required
                  maxLength={16}
                  error={errors.nik_salah_rekam}
                  helperText="Masukkan 16 digit NIK"
                  placeholder="Masukkan 16 angka"
                />
                <FlowbiteInput
                  label="Nama Salah Rekam"
                  name="nama_salah_rekam"
                  value={formData.nama_salah_rekam || ""}
                  onChange={handleInputChange}
                  type="text"
                  required
                  error={errors.nama_salah_rekam}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              </div>
            )}

            {/* Pemilik Biometric Section */}
            {activeSection === "biometric" && (
              <div className="space-y-4" role="tabpanel">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="bg-primary-100 dark:bg-primary-900/30 p-1.5 rounded-md mr-2">
                    <FingerPrintIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  Pemilik Biometric
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FlowbiteInput
                    label="NIK Pemilik Biometric"
                    name="nik_pemilik_biometric"
                    value={formData.nik_pemilik_biometric || ""}
                    onChange={handleInputChange}
                    type="text"
                    required
                    maxLength={16}
                    error={errors.nik_pemilik_biometric}
                    helperText="Masukkan 16 digit NIK"
                    placeholder="Masukkan 16 angka"
                  />
                  <FlowbiteInput
                    label="Nama Pemilik Biometric"
                    name="nama_pemilik_biometric"
                    value={formData.nama_pemilik_biometric || ""}
                    onChange={handleInputChange}
                    type="text"
                    required
                    error={errors.nama_pemilik_biometric}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
              </div>
            )}

            {/* Pemilik Foto Section */}
            {activeSection === "foto" && (
              <div className="space-y-4" role="tabpanel">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="bg-primary-100 dark:bg-primary-900/30 p-1.5 rounded-md mr-2">
                    <PhotoIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  Pemilik Foto
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FlowbiteInput
                    label="NIK Pemilik Foto"
                    name="nik_pemilik_foto"
                    value={formData.nik_pemilik_foto || ""}
                    onChange={handleInputChange}
                    type="text"
                    required
                    maxLength={16}
                    error={errors.nik_pemilik_foto}
                    helperText="Masukkan 16 digit NIK"
                    placeholder="Masukkan 16 angka"
                  />
                  <FlowbiteInput
                    label="Nama Pemilik Foto"
                    name="nama_pemilik_foto"
                    value={formData.nama_pemilik_foto || ""}
                    onChange={handleInputChange}
                    type="text"
                    required
                    error={errors.nama_pemilik_foto}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
              </div>
            )}

            {/* Petugas & Pengaju Section */}
            {activeSection === "petugas" && (
              <div className="space-y-4" role="tabpanel">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="bg-primary-100 dark:bg-primary-900/30 p-1.5 rounded-md mr-2">
                    <UsersIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  Petugas & Pengaju
                </h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Petugas Rekam</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FlowbiteInput
                        label="NIK Petugas Rekam"
                        name="nik_petugas_rekam"
                        value={formData.nik_petugas_rekam || ""}
                        onChange={handleInputChange}
                        type="text"
                        required
                        maxLength={16}
                        error={errors.nik_petugas_rekam}
                        helperText="Masukkan 16 digit NIK"
                        placeholder="Masukkan 16 angka"
                      />
                      <FlowbiteInput
                        label="Nama Petugas Rekam"
                        name="nama_petugas_rekam"
                        value={formData.nama_petugas_rekam || ""}
                        onChange={handleInputChange}
                        type="text"
                        required
                        error={errors.nama_petugas_rekam}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Pengaju</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FlowbiteInput
                        label="NIK Pengaju"
                        name="nik_pengaju"
                        value={formData.nik_pengaju || ""}
                        onChange={handleInputChange}
                        type="text"
                        readonly
                      />
                      <FlowbiteInput
                        label="Nama Pengaju"
                        name="nama_pengaju"
                        value={formData.nama_pengaju || ""}
                        onChange={handleInputChange}
                        type="text"
                        readonly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Perekaman Section */}
            {activeSection === "tanggal" && (
              <div className="space-y-4" role="tabpanel">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="bg-primary-100 dark:bg-primary-900/30 p-1.5 rounded-md mr-2">
                    <CalendarIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </span>
                  Detail Perekaman
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FlowbiteInput
                    label="Tanggal Perekaman"
                    name="tanggal_perekaman"
                    value={formData.tanggal_perekaman || ""}
                    onChange={handleInputChange}
                    type="date"
                    required
                    error={errors.tanggal_perekaman}
                  />
                  <FlowbiteInput
                    label="Estimasi Tanggal Perekaman Ulang"
                    name="estimasi_tanggal_perekaman"
                    value={formData.estimasi_tanggal_perekaman || ""}
                    onChange={handleInputChange}
                    type="date"
                    disabled={!["admin", "superuser"].includes(userRole)}
                    error={errors.estimasi_tanggal_perekaman}
                  />
                </div>

                {["admin", "superuser"].includes(userRole) && (
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_ready_to_record"
                        checked={formData.is_ready_to_record || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_ready_to_record: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Selesai</span>
                    </label>
                  </div>
                )}
              </div>
            )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-transform hover:scale-102 active:scale-98"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-white transition-transform ${
                loading
                  ? "bg-primary-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 hover:scale-102 active:scale-98"
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menyimpan...
                </div>
              ) : isEditing ? (
                "Perbarui Data"
              ) : (
                "Ajukan Data"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}






