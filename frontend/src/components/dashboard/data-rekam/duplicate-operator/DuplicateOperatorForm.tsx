"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";

// Flowbite Pro component interfaces (simplified for this implementation)
// In a real Flowbite Pro setup, these would be imported from "flowbite-react"
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
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  name?: string;
  maxLength?: number;
}

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

interface CheckboxProps {
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

// Simplified Flowbite Pro components (in production, import from "flowbite-react")
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
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
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
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className = "",
  "aria-label": ariaLabel,
  name,
  maxLength
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
    aria-label={ariaLabel}
    name={name}
    maxLength={maxLength}
    className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 ${className}`}
  />
);

const Label: React.FC<LabelProps> = ({ children, className = "" }) => (
  <label className={`mb-2 block text-sm font-medium text-gray-900 dark:text-white ${className}`}>
    {children}
  </label>
);

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled,
  className = "",
  "aria-label": ariaLabel
}) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-primary-600 ${className}`}
  />
);

import {
  UserIcon,
  UsersIcon,
  CheckIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Flowbite Heroicon integration for consistent iconography
import type {
  DuplicateOperatorData,
  DuplicateOperatorFormData,
} from "@/types/data-rekam/duplicate-operator";

// Enhanced interface with enterprise-grade features
interface DuplicateOperatorFormProps {
  /** Form data object */
  formData: DuplicateOperatorFormData;
  /** Form data setter function */
  setFormData: React.Dispatch<React.SetStateAction<DuplicateOperatorFormData>>;
  /** Form submission handler */
  onSubmit: (e: React.FormEvent) => Promise<void>;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  loading: boolean;
  /** Editing mode flag */
  isEditing: boolean;
  /** Edit data object */
  editData: DuplicateOperatorData | null;
  /** User role for permissions */
  userRole: string;
  /** Custom className for styling */
  className?: string;
  /** Animation delay for staggered animations */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Custom aria-label for accessibility */
  "aria-label"?: string;
}

const DuplicateOperatorForm: React.FC<DuplicateOperatorFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
  className,
  delay = 0,
  disableAnimations = false,
  "aria-label": ariaLabel,
}) => {
  // State management with better UX
  const [activeSection, setActiveSection] = useState<string>("duplicate");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Enhanced input change handler with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      // NIK validation - only allow digits
      if (
        ["nik_duplicate", "nik_operator", "nik_pengaju"].includes(name) &&
        value &&
        !/^\d*$/.test(value)
      ) {
        return;
      }

      // Update form data
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear validation error for this field
      if (validationErrors[name]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [setFormData, validationErrors],
  );

  // Form validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Required field validation
    if (!formData.nik_duplicate) {
      errors.nik_duplicate = "NIK Duplikat wajib diisi";
    } else if (formData.nik_duplicate.length !== 16) {
      errors.nik_duplicate = "NIK harus 16 digit";
    }

    if (!formData.nama_duplicate) {
      errors.nama_duplicate = "Nama Duplikat wajib diisi";
    }

    if (!formData.nik_operator) {
      errors.nik_operator = "NIK Operator wajib diisi";
    } else if (formData.nik_operator.length !== 16) {
      errors.nik_operator = "NIK harus 16 digit";
    }

    if (!formData.nama_operator) {
      errors.nama_operator = "Nama Operator wajib diisi";
    }

    if (!formData.tanggal_perekaman) {
      errors.tanggal_perekaman = "Tanggal Perekaman wajib diisi";
    }

    setValidationErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setIsFormValid(isValid);
    return isValid;
  }, [formData]);

  // Validate form on data changes
  useEffect(() => {
    if (showValidation) {
      validateForm();
    }
  }, [formData, showValidation, validateForm]);

  // Enhanced form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setShowValidation(true);

      if (!validateForm()) {
        // Focus on first error field
        const firstErrorField = Object.keys(validationErrors)[0];
        if (firstErrorField && formRef.current) {
          const errorElement = formRef.current.querySelector(
            `[name="${firstErrorField}"]`,
          ) as HTMLElement;
          errorElement?.focus();
        }
        return;
      }

      await onSubmit(e);
    },
    [onSubmit, validateForm, validationErrors],
  );

  // Enhanced sections with modern icons and better UX
  const sections = useMemo(
    () => [
      {
        id: "duplicate",
        title: "Data Duplikat",
        description: "Informasi data yang terduplikat",
        icon: UserIcon,
        color: "indigo",
        fields: ["nik_duplicate", "nama_duplicate"],
      },
      {
        id: "operator",
        title: "Data Operator",
        description: "Informasi operator yang menangani",
        icon: UsersIcon,
        color: "green",
        fields: ["nik_operator", "nama_operator"],
      },
      {
        id: "pengaju",
        title: "Data Pengaju",
        description: "Informasi pengaju permohonan",
        icon: CheckIcon,
        color: "blue",
        fields: ["nik_pengaju", "nama_pengaju"],
      },
      {
        id: "tanggal",
        title: "Detail Perekaman",
        description: "Tanggal dan status perekaman",
        icon: CalendarIcon,
        color: "purple",
        fields: [
          "tanggal_perekaman",
          "tanggal_pengajuan",
          "estimasi_tanggal_perekaman",
          "is_ready_to_record",
        ],
      },
    ],
    [],
  );

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation with Flowbite styling */}
        <div className="w-full bg-gray-50 p-4 dark:bg-gray-900 md:w-64">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                }}
                className={`flex w-full items-center rounded-lg px-4 py-3 text-left transition-colors duration-200 ${
                  activeSection === section.id
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
                aria-label={`Navigasi ke bagian ${section.title}`}
              >
                <span className="mr-3">
                  {/* Flowbite Heroicon integration for section icons */}
                  <section.icon className="h-5 w-5" />
                </span>
                <span className="font-medium">{section.title}</span>
                {activeSection === section.id && (
                  <span className="ml-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
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

        {/* Form Content with Flowbite styling */}
        <div className="flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-6" ref={formRef}>
            {/* Data Duplikat Section */}
            {activeSection === "duplicate" && (
              <div className="space-y-4">
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                    {/* Flowbite Heroicon integration for section header */}
                    <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </span>
                  Data Duplikat
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>
                      NIK Duplikat <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <TextInput
                        type="text"
                        name="nik_duplicate"
                        value={formData.nik_duplicate}
                        onChange={handleInputChange}
                        maxLength={16}
                        placeholder="Masukkan 16 angka"
                        required
                        aria-label="NIK Duplikat"
                      />
                      {formData.nik_duplicate &&
                        formData.nik_duplicate.length < 16 && (
                          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            NIK harus 16 digit (
                            {16 - formData.nik_duplicate.length} digit lagi)
                          </div>
                        )}
                    </div>
                  </div>
                  <div>
                    <Label>
                      Nama Duplikat <span className="text-red-500">*</span>
                    </Label>
                    <TextInput
                      type="text"
                      name="nama_duplicate"
                      value={formData.nama_duplicate}
                      onChange={handleInputChange}
                      required
                      aria-label="Nama Duplikat"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Operator Section */}
            {activeSection === "operator" && (
              <div className="space-y-4">
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-green-100 p-1.5 dark:bg-green-900/30">
                    {/* Flowbite Heroicon integration for section header */}
                    <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </span>
                  Data Operator
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>
                      NIK Operator <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <TextInput
                        type="text"
                        name="nik_operator"
                        value={formData.nik_operator}
                        onChange={handleInputChange}
                        maxLength={16}
                        placeholder="Masukkan 16 angka"
                        required
                        aria-label="NIK Operator"
                      />
                      {formData.nik_operator &&
                        formData.nik_operator.length < 16 && (
                          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            NIK harus 16 digit (
                            {16 - formData.nik_operator.length} digit lagi)
                          </div>
                        )}
                    </div>
                  </div>
                  <div>
                    <Label>
                      Nama Operator <span className="text-red-500">*</span>
                    </Label>
                    <TextInput
                      type="text"
                      name="nama_operator"
                      value={formData.nama_operator}
                      onChange={handleInputChange}
                      required
                      aria-label="Nama Operator"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Data Pengaju Section */}
            {activeSection === "pengaju" && (
              <div className="space-y-4">
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-blue-100 p-1.5 dark:bg-blue-900/30">
                    {/* Flowbite Heroicon integration for section header */}
                    <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </span>
                  Data Pengaju
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>NIK Pengaju</Label>
                    <TextInput
                      type="text"
                      name="nik_pengaju"
                      value={formData.nik_pengaju}
                      disabled
                      aria-label="NIK Pengaju"
                    />
                  </div>
                  <div>
                    <Label>Nama Pengaju</Label>
                    <TextInput
                      type="text"
                      name="nama_pengaju"
                      value={formData.nama_pengaju}
                      disabled
                      aria-label="Nama Pengaju"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Detail Perekaman Section */}
            {activeSection === "tanggal" && (
              <div className="space-y-4">
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-purple-100 p-1.5 dark:bg-purple-900/30">
                    {/* Flowbite Heroicon integration for section header */}
                    <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </span>
                  Detail Perekaman
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label>
                      Tanggal Perekaman <span className="text-red-500">*</span>
                    </Label>
                    <TextInput
                      type="date"
                      name="tanggal_perekaman"
                      value={formData.tanggal_perekaman}
                      onChange={handleInputChange}
                      required
                      aria-label="Tanggal Perekaman"
                    />
                  </div>
                  <div>
                    <Label>Tanggal Pengajuan</Label>
                    <TextInput
                      type="date"
                      name="tanggal_pengajuan"
                      value={formData.tanggal_pengajuan}
                      disabled
                      aria-label="Tanggal Pengajuan"
                    />
                  </div>
                </div>
                <div>
                  <Label>Estimasi Tanggal Perekaman Ulang</Label>
                  <TextInput
                    type="date"
                    name="estimasi_tanggal_perekaman"
                    value={formData.estimasi_tanggal_perekaman || ""}
                    onChange={handleInputChange}
                    disabled={!["admin", "superuser"].includes(userRole)}
                    aria-label="Estimasi Tanggal Perekaman Ulang"
                  />
                </div>
                {["admin", "superuser"].includes(userRole) && (
                  <div className="mt-4">
                    <label className="flex items-center">
                      <Checkbox
                        checked={formData.is_ready_to_record || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_ready_to_record: e.target.checked,
                          }))
                        }
                        aria-label="Selesai"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Selesai
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions with Flowbite Button components */}
            <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              <Button
                type="button"
                onClick={onCancel}
                color="gray"
                size="lg"
              >
                {/* Flowbite Heroicon integration for cancel action */}
                <XMarkIcon className="h-5 w-5 mr-2" />
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                color="blue"
                size="lg"
              >
                {loading ? (
                  <>
                    {/* Flowbite Heroicon integration for loading state */}
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {/* Flowbite Heroicon integration for save action */}
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    {isEditing ? "Perbarui Data" : "Ajukan Data"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DuplicateOperatorForm;