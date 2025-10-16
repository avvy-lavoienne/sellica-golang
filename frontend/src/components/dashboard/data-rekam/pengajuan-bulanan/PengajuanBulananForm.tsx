"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import type { PengajuanBulananData, PengajuanBulananFormData } from "@/types/data-rekam/pengajuan-bulanan";
import {
  UserIcon,
  DocumentTextIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface PengajuanBulananFormProps {
  formData: PengajuanBulananFormData;
  setFormData: React.Dispatch<React.SetStateAction<PengajuanBulananFormData>>;
  onSubmit: (data: PengajuanBulananFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
  editData: PengajuanBulananData | null;
  userRole: string;
}

const PengajuanBulananForm: React.FC<PengajuanBulananFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
}) => {
  const [activeSection, setActiveSection] = useState<string>("dataPengajuan");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "nik_pengajuan_hapus" && value && !/^\d*$/.test(value)) {
      return; // Only allow digits for NIK fields
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sections = [
    {
      id: "dataPengajuan",
      title: "Data Pengajuan",
      icon: <UserIcon className="h-5 w-5" />,
    },
    {
      id: "alasanPengajuan",
      title: "Alasan Pengajuan",
      icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: "pengaju",
      title: "Pengaju",
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      id: "detailPengajuan",
      title: "Detail Pengajuan",
      icon: <CalendarIcon className="h-5 w-5" />,
    },
  ];

  const isAdmin = ["admin", "superuser"].includes(userRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSubmit(formData);
      onCancel();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Formulir Pengajuan
            </h3>
            <nav className="space-y-2" role="tablist" aria-label="Form sections">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                  role="tab"
                  aria-selected={activeSection === section.id}
                  aria-controls={`panel-${section.id}`}
                >
                  <span className="mr-3 text-gray-500 dark:text-gray-400">
                    {section.icon}
                  </span>
                  <span className="font-medium">{section.title}</span>
                  {activeSection === section.id && (
                    <span className="ml-auto">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data Pengajuan Section */}
            {activeSection === "dataPengajuan" && (
              <div className="space-y-6" role="tabpanel" id="panel-dataPengajuan">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Data Pengajuan
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      NIK Pengajuan Hapus <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nik_pengajuan_hapus"
                      value={formData.nik_pengajuan_hapus}
                      onChange={handleInputChange}
                      maxLength={16}
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Masukkan 16 angka"
                      required
                      aria-describedby="nik-help"
                    />
                    {formData.nik_pengajuan_hapus && formData.nik_pengajuan_hapus.length < 16 && (
                      <p id="nik-help" className="text-xs text-amber-600 dark:text-amber-400">
                        NIK harus 16 digit ({16 - formData.nik_pengajuan_hapus.length} digit lagi)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Nama Pengajuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_pengajuan"
                      value={formData.nama_pengajuan}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Alasan Pengajuan Section */}
            {activeSection === "alasanPengajuan" && (
              <div className="space-y-6" role="tabpanel" id="panel-alasanPengajuan">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Alasan Pengajuan
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Alasan Pengajuan <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="alasan_pengajuan"
                      value={formData.alasan_pengajuan}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required
                    >
                      <option value="" disabled>
                        Pilih Alasan Pengajuan
                      </option>
                      <option value="MISSING BIOMETRIC EXCEPTION">Missing Biometric Exception</option>
                      <option value="NIK TANPA BIOMETRIC FINGERS">NIK Tanpa Biometric Fingers</option>
                      <option value="DUPLICATE DENGAN ORANG LAIN">Duplicate dengan Orang Lain</option>
                      <option value="DUPLICATE DENGAN NIK TANPA DATA REKAM">Duplicate dengan NIK Tanpa Data Rekam</option>
                      <option value="ONE TO MANY">One to Many</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>

                  {formData.alasan_pengajuan === "LAINNYA" && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        Alasan Lainnya <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="alasan_lainnya"
                        value={formData.alasan_lainnya || ""}
                        onChange={handleInputChange}
                        rows={4}
                        className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="Jelaskan alasan pengajuan lainnya..."
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pengaju Section */}
            {activeSection === "pengaju" && (
              <div className="space-y-6" role="tabpanel" id="panel-pengaju">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Data Pengaju
                  </h2>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Data pengaju diisi otomatis berdasarkan akun yang sedang login.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        NIK Pengaju
                      </label>
                      <input
                        type="text"
                        name="nik_pengaju"
                        value={formData.nik_pengaju}
                        className="block w-full px-3 py-2.5 text-sm text-gray-500 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        Nama Pengaju
                      </label>
                      <input
                        type="text"
                        name="nama_pengaju"
                        value={formData.nama_pengaju}
                        className="block w-full px-3 py-2.5 text-sm text-gray-500 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Pengajuan Section */}
            {activeSection === "detailPengajuan" && (
              <div className="space-y-6" role="tabpanel" id="panel-detailPengajuan">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Detail Pengajuan
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        Tanggal Pengajuan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="tanggal_pengajuan"
                        value={formData.tanggal_pengajuan}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white">
                        Estimasi Tanggal Perekaman Ulang
                      </label>
                      <input
                        type="date"
                        name="estimasi_tanggal_perekaman"
                        value={formData.estimasi_tanggal_perekaman || ""}
                        onChange={handleInputChange}
                        className={`block w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          isAdmin
                            ? "text-gray-900 bg-gray-50 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            : "text-gray-500 bg-gray-100 border-gray-300 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400"
                        }`}
                        disabled={!isAdmin}
                      />
                      {!isAdmin && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Hanya admin yang dapat mengubah estimasi tanggal
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
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
                          className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Tandai sebagai siap untuk direkam ulang
                        </span>
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-7">
                        Centang jika pengajuan ini sudah siap untuk proses perekaman ulang.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                disabled={loading}
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Batal
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-700 border border-transparent rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Perbarui Data
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Ajukan Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PengajuanBulananForm;