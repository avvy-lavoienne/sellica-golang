"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import type { AdjudicateRecordData, AdjudicateRecordFormData } from "@/types/data-rekam/adjudicate-record";
import {
  UserIcon,
  DocumentTextIcon,
  UsersIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface AdjudicateRecordFormProps {
  formData: AdjudicateRecordFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdjudicateRecordFormData>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
  editData: AdjudicateRecordData | null;
  userRole: string;
}

const AdjudicateRecordForm: React.FC<AdjudicateRecordFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
}) => {
  const [activeSection, setActiveSection] = useState<string>("dataAdjudicate");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Only allow digits for NIK fields
    if ((name === "nik_adjudicate" || name === "nik_pengaju") && value && !/^\d*$/.test(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sections = [
    {
      id: "dataAdjudicate",
      title: "Data Adjudicate",
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
    {
      id: "jenisEksepsi",
      title: "Jenis Eksepsi",
      icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    {
      id: "dataPengaju",
      title: "Data Pengaju",
      icon: <UsersIcon className="h-5 w-5" />,
    },
    {
      id: "detailAdjudicate",
      title: "Detail Adjudicate",
      icon: <CalendarIcon className="h-5 w-5" />,
    },
  ];

  const isAdmin = ["admin", "superuser"].includes(userRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(e);
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
              Formulir Adjudicate
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
            {/* Data Adjudicate Section */}
            {activeSection === "dataAdjudicate" && (
              <div className="space-y-6" role="tabpanel" id="panel-dataAdjudicate">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Data Adjudicate
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      NIK Adjudicate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nik_adjudicate"
                      value={formData.nik_adjudicate}
                      onChange={handleInputChange}
                      maxLength={16}
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Masukkan 16 angka"
                      required
                      aria-describedby="nik-adjudicate-help"
                    />
                    {formData.nik_adjudicate && formData.nik_adjudicate.length < 16 && (
                      <p id="nik-adjudicate-help" className="text-xs text-amber-600 dark:text-amber-400">
                        NIK harus 16 digit ({16 - formData.nik_adjudicate.length} digit lagi)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Nama Adjudicate <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_adjudicate"
                      value={formData.nama_adjudicate}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Jenis Eksepsi Section */}
            {activeSection === "jenisEksepsi" && (
              <div className="space-y-6" role="tabpanel" id="panel-jenisEksepsi">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Jenis Eksepsi
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Jenis Eksepsi <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="jenis_eksepsi"
                      value={formData.jenis_eksepsi}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
                </div>
              </div>
            )}

            {/* Data Pengaju Section */}
            {activeSection === "dataPengaju" && (
              <div className="space-y-6" role="tabpanel" id="panel-dataPengaju">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Data Pengaju
                  </h2>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ Data pengaju diisi otomatis berdasarkan akun yang sedang login dan tidak dapat diubah.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      NIK Pengaju <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nik_pengaju"
                      value={formData.nik_pengaju}
                      disabled
                      maxLength={16}
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-not-allowed opacity-75"
                      placeholder="NIK Pengaju"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bidang ini terkunci dan diisi otomatis dari profil Anda</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white">
                      Nama Pengaju <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_pengaju"
                      value={formData.nama_pengaju}
                      disabled
                      className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white cursor-not-allowed opacity-75"
                      placeholder="Nama Pengaju"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bidang ini terkunci dan diisi otomatis dari profil Anda</p>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Adjudicate Section */}
            {activeSection === "detailAdjudicate" && (
              <div className="space-y-6" role="tabpanel" id="panel-detailAdjudicate">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Detail Adjudicate
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
                        Estimasi Tanggal Perekaman
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
                        Centang jika adjudicate ini sudah siap untuk proses perekaman ulang.
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

export default AdjudicateRecordForm;
