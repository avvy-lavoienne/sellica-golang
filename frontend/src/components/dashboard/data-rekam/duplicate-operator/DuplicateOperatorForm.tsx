"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import type {
  DuplicateOperatorData,
  DuplicateOperatorFormData,
} from "@/types/data-rekam/duplicate-operator";
import { User, Users, UserCheck, Calendar } from "lucide-react";

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

export default function DuplicateOperatorForm({
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
}: DuplicateOperatorFormProps) {
  // State management with better UX
  const [activeSection, setActiveSection] = useState<string>("duplicate");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system consistent with other components
  const colorSchemes = useMemo(
    () => ({
      primary: {
        bg: "bg-primary/5",
        text: "text-primary",
        accent: "text-primary",
        bgClass: "bg-primary/5",
        borderClass: "border-primary/20",
        glowClass: "shadow-primary/20",
      },
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200 dark:border-indigo-800",
        glowClass: "shadow-indigo-500/20",
      },
    }),
    [],
  );

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
        icon: User,
        color: "indigo",
        fields: ["nik_duplicate", "nama_duplicate"],
      },
      {
        id: "operator",
        title: "Data Operator",
        description: "Informasi operator yang menangani",
        icon: Users,
        color: "green",
        fields: ["nik_operator", "nama_operator"],
      },
      {
        id: "pengaju",
        title: "Data Pengaju",
        description: "Informasi pengaju permohonan",
        icon: UserCheck,
        color: "blue",
        fields: ["nik_pengaju", "nama_pengaju"],
      },
      {
        id: "tanggal",
        title: "Detail Perekaman",
        description: "Tanggal dan status perekaman",
        icon: Calendar,
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

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  const sidebarVariants = {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: "easeOut" as const,
        staggerChildren: 0.05,
      },
    },
  };

  // Get section completion status
  const getSectionStatus = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      if (!section) return { completed: false, hasErrors: false };

      const hasErrors = section.fields.some((field) => validationErrors[field]);
      const completed = section.fields.every((field) => {
        if (
          field === "is_ready_to_record" ||
          field === "estimasi_tanggal_perekaman"
        )
          return true;
        return formData[field as keyof DuplicateOperatorFormData];
      });

      return { completed, hasErrors };
    },
    [sections, validationErrors, formData],
  );

  // Accessibility attributes
  const accessibilityProps = {
    role: "form",
    "aria-label":
      ariaLabel ||
      `Form ${isEditing ? "edit" : "pengajuan"} duplicate operator`,
    "aria-describedby": "form-description",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar Navigation */}
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

        {/* Form Content */}
        <div className="flex-1 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Data Duplikat Section */}
            {activeSection === "duplicate" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </span>
                  Data Duplikat
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      NIK Duplikat <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="nik_duplicate"
                        value={formData.nik_duplicate}
                        onChange={handleInputChange}
                        maxLength={16}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nama Duplikat <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_duplicate"
                      value={formData.nama_duplicate}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                      aria-label="Nama Duplikat"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data Operator Section */}
            {activeSection === "operator" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </span>
                  Data Operator
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      NIK Operator <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="nik_operator"
                        value={formData.nik_operator}
                        onChange={handleInputChange}
                        maxLength={16}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nama Operator <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_operator"
                      value={formData.nama_operator}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                      aria-label="Nama Operator"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data Pengaju Section */}
            {activeSection === "pengaju" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                  Data Pengaju
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      NIK Pengaju
                    </label>
                    <input
                      type="text"
                      name="nik_pengaju"
                      value={formData.nik_pengaju}
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400"
                      readOnly
                      aria-label="NIK Pengaju"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nama Pengaju
                    </label>
                    <input
                      type="text"
                      name="nama_pengaju"
                      value={formData.nama_pengaju}
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400"
                      readOnly
                      aria-label="Nama Pengaju"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detail Perekaman Section */}
            {activeSection === "tanggal" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <h2 className="flex items-center text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <span className="mr-2 rounded-md bg-indigo-100 p-1.5 dark:bg-indigo-900/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </span>
                  Detail Perekaman
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tanggal Perekaman <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="tanggal_perekaman"
                      value={formData.tanggal_perekaman}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      required
                      aria-label="Tanggal Perekaman"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tanggal Pengajuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="tanggal_pengajuan"
                      value={formData.tanggal_pengajuan}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400"
                      readOnly
                      aria-label="Tanggal Pengajuan"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Estimasi Tanggal Perekaman Ulang
                  </label>
                  <input
                    type="date"
                    name="estimasi_tanggal_perekaman"
                    value={formData.estimasi_tanggal_perekaman || ""}
                    onChange={handleInputChange}
                    className={
                      ["admin", "superuser"].includes(userRole)
                        ? "w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        : "w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-400"
                    }
                    disabled={!["admin", "superuser"].includes(userRole)}
                    aria-label="Estimasi Tanggal Perekaman Ulang"
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
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label="Selesai"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Selesai
                      </span>
                    </label>
                  </div>
                )}
              </motion.div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              <motion.button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-gray-300 px-6 py-2.5 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-800"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Batalkan pengajuan"
              >
                Batal
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                className={`rounded-lg px-6 py-2.5 text-white ${
                  loading
                    ? "cursor-not-allowed bg-indigo-400"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                }`}
                whileHover={loading ? {} : { scale: 1.02 }}
                whileTap={loading ? {} : { scale: 0.98 }}
                aria-label={
                  loading
                    ? "Sedang menyimpan"
                    : isEditing
                      ? "Perbarui data"
                      : "Ajukan data"
                }
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
  );
}
