"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { AdjudicateRecordData, AdjudicateRecordFormData } from "@/types/data-rekam/adjudicate-record";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ShieldCheckIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// Flowbite Pro component interfaces (simplified for this implementation)
// In a real Flowbite Pro setup, these would be imported from "flowbite-react"
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  size?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
}

interface TextInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ComponentType<any>;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  required?: boolean;
  type?: string;
}

interface LabelProps {
  children?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  value?: string;
}

interface SelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

// Simplified Flowbite Pro components (in production, import from "flowbite-react")
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  color = "blue",
  size = "md",
  className = "",
  type = "button"
}) => {
  const baseClasses = "inline-flex items-center rounded-lg font-medium focus:outline-none focus:ring-4 transition-all duration-200";
  const colorClasses = {
    blue: "bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    gray: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800",
    red: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800",
    green: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
  };
  const sizeClasses = {
    xs: "px-3 py-2 text-xs",
    sm: "px-5 py-2.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-5 py-3 text-base"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses[color as keyof typeof colorClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = "",
  icon: Icon,
  className = "",
  disabled = false,
  maxLength,
  required = false,
  type = "text"
}) => (
  <div className={`relative ${className}`}>
    {Icon && (
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      required={required}
      className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-600' : ''}`}
    />
  </div>
);

const Label: React.FC<LabelProps> = ({ children, htmlFor, className = "", value }) => (
  <label htmlFor={htmlFor} className={`mb-2 block text-sm font-medium text-gray-900 dark:text-white ${className}`}>
    {value || children}
  </label>
);

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
  required = false
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    required={required}
    className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-600' : ''} ${className}`}
  >
    {children}
  </select>
);

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
  // Core state for form navigation and validation
  const [activeSection, setActiveSection] = useState<string>("adjudicate");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search for potential future use
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Form input change handler with validation
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Permission-based field restrictions
    if (
      userRole === "user" &&
      ["estimasi_tanggal_perekaman", "is_ready_to_record"].includes(name)
    ) {
      return;
    }

    // NIK validation - only digits allowed
    if (name === "nik_adjudicate" && value && !/^\d*$/.test(value)) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }, [userRole, setFormData]);

  // Form sections with Flowbite-compatible navigation
  const sections = [
    {
      id: "adjudicate",
      title: "Data Adjudicate",
      icon: ShieldCheckIcon, // Flowbite Heroicon integration
      description: "Informasi adjudicate yang akan direkam"
    },
    {
      id: "pengaju",
      title: "Data Pengaju",
      icon: UserIcon, // Flowbite Heroicon integration
      description: "Informasi pengaju permohonan"
    },
    {
      id: "detail",
      title: "Detail Pengajuan",
      icon: DocumentTextIcon, // Flowbite Heroicon integration
      description: "Detail permohonan dan status"
    },
  ];

  return (
    <Card className="w-full overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Navigation - Flowbite-style navigation */}
        <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Formulir Adjudicate Record
            </h3>
            {sections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-start p-4 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className={`p-2 rounded-lg mr-3 ${isActive ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-200 dark:bg-gray-700'}`}>
                    <IconComponent className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                      {section.title}
                    </div>
                    <div className={`text-sm mt-1 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                      {section.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="ml-2">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content Area */}
        <div className="flex-1 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Data Adjudicate Section */}
            {activeSection === "adjudicate" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Data Adjudicate
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Informasi lengkap adjudicate yang akan direkam
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NIK Adjudicate - Flowbite TextInput with validation */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="nik_adjudicate" value="NIK Adjudicate" />
                      <span className="text-red-500 text-sm">*</span>
                    </div>
                    <TextInput
                      id="nik_adjudicate"
                      name="nik_adjudicate"
                      type="text"
                      value={formData.nik_adjudicate ?? ""}
                      onChange={handleInputChange}
                      maxLength={16}
                      placeholder="Masukkan 16 digit NIK"
                      required
                      className="w-full"
                    />
                    {formData.nik_adjudicate && formData.nik_adjudicate.length < 16 && (
                      <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                        <span>NIK harus 16 digit</span>
                        <span className="font-medium">
                          ({16 - formData.nik_adjudicate.length} digit lagi)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nama Adjudicate - Flowbite TextInput */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="nama_adjudicate" value="Nama Adjudicate" />
                      <span className="text-red-500 text-sm">*</span>
                    </div>
                    <TextInput
                      id="nama_adjudicate"
                      name="nama_adjudicate"
                      type="text"
                      value={formData.nama_adjudicate ?? ""}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama lengkap"
                      required
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Pengaju Section */}
            {activeSection === "pengaju" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Data Pengaju
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Informasi pengaju permohonan (readonly)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NIK Pengaju - Readonly Flowbite TextInput */}
                  <div className="space-y-2">
                    <Label htmlFor="nik_pengaju" value="NIK Pengaju" />
                    <TextInput
                      id="nik_pengaju"
                      name="nik_pengaju"
                      type="text"
                      value={formData.nik_pengaju ?? ""}
                      onChange={() => {}} // No-op for readonly
                      disabled
                      className="w-full"
                    />
                  </div>

                  {/* Nama Pengaju - Readonly Flowbite TextInput */}
                  <div className="space-y-2">
                    <Label htmlFor="nama_pengaju" value="Nama Pengaju" />
                    <TextInput
                      id="nama_pengaju"
                      name="nama_pengaju"
                      type="text"
                      value={formData.nama_pengaju ?? ""}
                      onChange={() => {}} // No-op for readonly
                      disabled
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Detail Pengajuan Section */}
            {activeSection === "detail" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Detail Pengajuan
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Detail permohonan dan status perekaman
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Jenis Eksepsi - Flowbite Select */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="jenis_eksepsi" value="Jenis Eksepsi" />
                      <span className="text-red-500 text-sm">*</span>
                    </div>
                    <Select
                      id="jenis_eksepsi"
                      name="jenis_eksepsi"
                      value={formData.jenis_eksepsi ?? ""}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    >
                      <option value="" disabled>
                        Pilih Jenis Eksepsi
                      </option>
                      <option value="eksepsi sidik jari">Eksepsi Sidik Jari</option>
                      <option value="eksepsi iris mata">Eksepsi Iris Mata</option>
                      <option value="eksepsi total">Eksepsi Total</option>
                    </Select>
                  </div>

                  {/* Tanggal Pengajuan - Flowbite date input */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label htmlFor="tanggal_pengajuan" value="Tanggal Pengajuan" />
                      <span className="text-red-500 text-sm">*</span>
                    </div>
                    <TextInput
                      id="tanggal_pengajuan"
                      name="tanggal_pengajuan"
                      type="date"
                      value={formData.tanggal_pengajuan ?? ""}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Estimasi Tanggal Perekaman - Permission-based */}
                  <div className="space-y-2">
                    <Label htmlFor="estimasi_tanggal_perekaman" value="Estimasi Tanggal Perekaman" />
                    <TextInput
                      id="estimasi_tanggal_perekaman"
                      name="estimasi_tanggal_perekaman"
                      type="date"
                      value={formData.estimasi_tanggal_perekaman || ""}
                      onChange={handleInputChange}
                      disabled={!["admin", "superuser"].includes(userRole)}
                      className="w-full"
                    />
                    {!["admin", "superuser"].includes(userRole) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Hanya admin yang dapat mengubah estimasi tanggal
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Checkbox - Admin only */}
                {["admin", "superuser"].includes(userRole) && (
                  <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Label value="Status Perekaman" />
                    <label className="flex items-center space-x-3 cursor-pointer">
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900 dark:text-white font-medium">
                        Tandai sebagai siap direkam
                      </span>
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Centang jika data adjudicate sudah lengkap dan siap untuk proses perekaman
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions - Flowbite Button components */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={onCancel}
                color="gray"
                size="md"
                className="w-full sm:w-auto"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Batal
              </Button>

              <Button
                type="submit"
                disabled={loading}
                color="blue"
                size="md"
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : isEditing ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Perbarui Data
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    Ajukan Data
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};

export default AdjudicateRecordForm;
