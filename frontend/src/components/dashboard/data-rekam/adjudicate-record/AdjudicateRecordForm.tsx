"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import type { AdjudicateRecordData, AdjudicateRecordFormData } from "@/types/data-rekam/adjudicate-record"
import { useDebounce } from '@/hooks/use-debounce';

interface AdjudicateRecordFormProps {
  formData: AdjudicateRecordFormData
  setFormData: React.Dispatch<React.SetStateAction<AdjudicateRecordFormData>>
  onSubmit: (e: React.FormEvent) => Promise<void>
  onCancel: () => void
  loading: boolean
  isEditing: boolean
  editData: AdjudicateRecordData | null
  userRole: string
}

export default function AdjudicateRecordForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
}: AdjudicateRecordFormProps) {
  const [activeSection, setActiveSection] = useState<string>("adjudicate")
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Restrict users from editing certain fields
    if (
      userRole === "user" &&
      ["estimasi_tanggal_perekaman", "is_ready_to_record"].includes(name)
    ) {
      return;
    }

    if (name === "nik_adjudicate" && value && !/^\d*$/.test(value)) {
      return; // Only allow digits for NIK fields
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const sections = [
    {
      id: "adjudicate",
      title: "Data Adjudicate",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      id: "pengaju",
      title: "Data Pengaju",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
    {
      id: "detail",
      title: "Detail Pengajuan",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                  activeSection === section.id
                    ? "bg-primary-light/20 text-primary dark:bg-primary-dark/30 dark:text-primary-light"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="mr-3">{section.icon}</span>
                <span className="font-medium">{section.title}</span>
                {activeSection === section.id && (
                  <span className="ml-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Data Adjudicate Section */}
            {activeSection === "adjudicate" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="bg-primary-light/20 dark:bg-primary-dark/30 p-1.5 rounded-md mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary dark:text-primary-light"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </span>
                  Data Adjudicate
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      NIK Adjudicate <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="nik_adjudicate"
                        value={formData.nik_adjudicate ?? ""}
                        onChange={handleInputChange}
                        maxLength={16}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        placeholder="Masukkan 16 angka"
                        required
                      />
                      {formData.nik_adjudicate && formData.nik_adjudicate.length < 16 && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          NIK harus 16 digit ({16 - formData.nik_adjudicate.length} digit lagi)
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Adjudicate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_adjudicate"
                      value={formData.nama_adjudicate ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data Pengaju Section */}
            {activeSection === "pengaju" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="bg-primary-light/20 dark:bg-primary-dark/30 p-1.5 rounded-md mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary dark:text-primary-light"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </span>
                  Data Pengaju
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      NIK Pengaju
                    </label>
                    <input
                      type="text"
                      name="nik_pengaju"
                      value={formData.nik_pengaju ?? ""}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Pengaju
                    </label>
                    <input
                      type="text"
                      name="nama_pengaju"
                      value={formData.nama_pengaju ?? ""}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      readOnly
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detail Pengajuan Section */}
            {activeSection === "detail" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <span className="bg-primary-light/20 dark:bg-primary-dark/30 p-1.5 rounded-md mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary dark:text-primary-light"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </span>
                  Detail Pengajuan
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jenis Eksepsi <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jenis_eksepsi"
                      value={formData.jenis_eksepsi ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="" disabled>
                        Pilih Jenis Eksepsi
                      </option>
                      <option value="eksepsi sidik jari">Eksepsi Sidik Jari</option>
                      <option value="eksepsi iris mata">Eksepsi Iris Mata</option>
                      <option value="eksepsi total">Eksepsi Total</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tanggal Pengajuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="tanggal_pengajuan"
                      value={formData.tanggal_pengajuan ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Estimasi Tanggal Perekaman
                    </label>
                    <input
                      type="date"
                      name="estimasi_tanggal_perekaman"
                      value={formData.estimasi_tanggal_perekaman || ""}
                      onChange={handleInputChange}
                      className={
                        ["admin", "superuser"].includes(userRole)
                          ? "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          : "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      }
                      disabled={!["admin", "superuser"].includes(userRole)}
                    />
                  </div>
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
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Selesai</span>
                    </label>
                  </div>
                )}
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <motion.button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Batal
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className={`px-6 py-2.5 rounded-lg text-white ${
                  loading
                    ? "bg-primary/70 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-gray-800"
                }`}
                whileHover={loading ? {} : { scale: 1.02 }}
                whileTap={loading ? {} : { scale: 0.98 }}
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
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
