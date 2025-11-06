"use client";

import type React from "react";
import {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import type {
  PengaduanBulananData,
  PengaduanBulananFormData,
} from "@/types/aktivitas-user/pengaduan-bulanan";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  FileText,
  Phone,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
  Save,
  X,
  Send,
  Edit,
  Info,
  Shield,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

// Type definitions
interface FieldValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: string) => string | null;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
}

interface PengaduanBulananFormProps {
  formData: PengaduanBulananFormData;
  setFormData: React.Dispatch<React.SetStateAction<PengaduanBulananFormData>>;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  onCancel: () => void;
  loading: boolean;
  isEditing: boolean;
  editData: PengaduanBulananData | null;
  userRole: string;
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
  enableAutoSave?: boolean;
  onAutoSave?: (data: PengaduanBulananFormData) => Promise<void>;
  errors?: Record<string, string>;
  success?: boolean;
  showProgress?: boolean;
}

// Validation rules following Flowbite best practices
const VALIDATION_RULES: Record<string, FieldValidationRules> = {
  nik_pengaduan: {
    required: true,
    pattern: /^\d{16}$/,
    customValidator: (value) =>
      value.length !== 16 ? "NIK harus 16 digit" : null,
  },
  nama_pengaduan: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  alasan_pengaduan: {
    required: true,
    minLength: 5,
    maxLength: 200,
  },
  deskripsi_pengaduan: {
    required: true,
    minLength: 10,
    maxLength: 2000,
  },
  nomor_telepon: {
    required: true,
    pattern: /^(\+62|0)(\d{9,12})$/,
  },
  tanggal_pengaduan: {
    required: true,
  },
};

// Enhanced field configuration for form rendering
interface FieldConfig {
  name: keyof PengaduanBulananFormData;
  label: string;
  type: "text" | "textarea" | "date" | "tel" | "email";
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  helperText: string;
  section: string;
  required: boolean;
  maxLength?: number;
}

const FORM_FIELDS: FieldConfig[] = [
  {
    name: "nik_pengaduan",
    label: "NIK Pengaduan",
    type: "text",
    placeholder: "Masukkan NIK (16 digit)",
    icon: User,
    helperText: "Masukkan nomor identitas nasional Anda dengan 16 digit",
    section: "basic",
    required: true,
    maxLength: 16,
  },
  {
    name: "nama_pengaduan",
    label: "Nama Pengaduan",
    type: "text",
    placeholder: "Masukkan judul pengaduan",
    icon: FileText,
    helperText: "Berikan judul singkat untuk pengaduan Anda",
    section: "basic",
    required: true,
    maxLength: 100,
  },
  {
    name: "alasan_pengaduan",
    label: "Alasan Pengaduan",
    type: "text",
    placeholder: "Alasan utama pengaduan",
    icon: MessageSquare,
    helperText: "Jelaskan alasan utama pengaduan Anda",
    section: "complaint",
    required: true,
    maxLength: 200,
  },
  {
    name: "deskripsi_pengaduan",
    label: "Deskripsi Detail",
    type: "textarea",
    placeholder: "Jelaskan secara detail pengaduan Anda...",
    icon: FileText,
    helperText: "Sediakan rincian lengkap tentang masalah Anda",
    section: "complaint",
    required: true,
    maxLength: 2000,
  },
  {
    name: "nomor_telepon",
    label: "Nomor Telepon",
    type: "tel",
    placeholder: "08xxxxxxxxxx",
    icon: Phone,
    helperText: "Format: 08xxxxxxxxxx (nomor seluler Indonesia)",
    section: "contact",
    required: true,
  },
  {
    name: "tanggal_pengaduan",
    label: "Tanggal Pengajuan",
    type: "date",
    placeholder: "Pilih tanggal",
    icon: Calendar,
    helperText: "Tanggal saat Anda mengajukan pengaduan",
    section: "contact",
    required: true,
  },
];

export default function PengaduanBulananForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  loading,
  isEditing,
  editData,
  userRole,
  className,
  delay = 0.3,
  disableAnimations = false,
  enableAutoSave = false,
  onAutoSave,
  errors = {},
  success = false,
  showProgress = true,
}: PengaduanBulananFormProps) {
  // State management
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  // Refs for accessibility and focus management
  const formRef = useRef<HTMLFormElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Form validation logic following WCAG standards
  const validateField = useCallback(
    (fieldName: string, value: string): ValidationResult => {
      const rules = VALIDATION_RULES[fieldName];
      if (!rules) return { isValid: true, message: "" };

      // Required field check
      if (rules.required && !value.trim()) {
        return {
          isValid: false,
          message: `${fieldName} wajib diisi`,
        };
      }

      // Min length check
      if (rules.minLength && value.length < rules.minLength) {
        return {
          isValid: false,
          message: `Minimal ${rules.minLength} karakter diperlukan`,
        };
      }

      // Max length check
      if (rules.maxLength && value.length > rules.maxLength) {
        return {
          isValid: false,
          message: `Maksimal ${rules.maxLength} karakter diizinkan`,
        };
      }

      // Pattern check
      if (rules.pattern && !rules.pattern.test(value)) {
        return {
          isValid: false,
          message: `Format ${fieldName} tidak valid`,
        };
      }

      // Custom validator
      if (rules.customValidator) {
        const customError = rules.customValidator(value);
        if (customError) {
          return { isValid: false, message: customError };
        }
      }

      return { isValid: true, message: "" };
    },
    [],
  );

  // Calculate form progress and validation
  const formValidation = useMemo(() => {
    const requiredFields = FORM_FIELDS.filter((f) => f.required);
    const filledFields = requiredFields.filter(
      (field) => {
        const value = formData[field.name];
        return value && value.toString().trim() &&
               validateField(field.name, value.toString()).isValid;
      },
    );

    const progress = (filledFields.length / requiredFields.length) * 100;
    return {
      isValid: filledFields.length === requiredFields.length,
      progress: Math.round(progress),
      filledFields: filledFields.length,
      totalFields: requiredFields.length,
    };
  }, [formData, validateField]);

  // Update progress
  useEffect(() => {
    setFormProgress(formValidation.progress);
  }, [formValidation.progress]);

  // Enhanced input handler with real-time validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Enforce max length
      const maxLength = FORM_FIELDS.find((f) => f.name === name)?.maxLength;
      if (maxLength && value.length > maxLength) {
        return;
      }

      // Update form data
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Mark field as touched
      setTouchedFields((prev) => new Set([...prev, name]));

      // Real-time validation
      const validation = validateField(name, value);
      if (validation.isValid) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      } else if (touchedFields.has(name)) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: validation.message,
        }));
      }

      // Auto-save functionality
      if (enableAutoSave && onAutoSave) {
        setAutoSaveStatus("saving");
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(async () => {
          try {
            await onAutoSave({ ...formData, [name]: value });
            setAutoSaveStatus("saved");
            setTimeout(() => setAutoSaveStatus("idle"), 2000);
          } catch (error) {
            setAutoSaveStatus("error");
            setTimeout(() => setAutoSaveStatus("idle"), 3000);
          }
        }, 1500);
      }
    },
    [
      formData,
      touchedFields,
      enableAutoSave,
      onAutoSave,
      validateField,
      setFormData,
    ],
  );

  // Handle form blur for validation feedback
  const handleFieldBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.currentTarget;

      setTouchedFields((prev) => new Set([...prev, name]));

      const validation = validateField(name, value);
      if (!validation.isValid) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: validation.message,
        }));
      }
    },
    [validateField],
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay,
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldAnimate ? 0.4 : 0, ease: "easeOut" as const },
    },
  };

  // Section renderer for organized form layout
  const renderFormSection = (sectionName: string, sectionTitle: string, icon: React.ComponentType<{ className?: string }>) => {
    const Icon = icon;
    const sectionFields = FORM_FIELDS.filter((f) => f.section === sectionName);

    if (sectionFields.length === 0) return null;

    return (
      <motion.div
        key={sectionName}
        variants={itemVariants}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 border-b border-border/30 pb-3">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-foreground">
            {sectionTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {sectionFields.map((field) => (
            <div
              key={field.name}
              className={field.type === "textarea" ? "md:col-span-2" : ""}
            >
              {renderFormField(field)}
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Individual field renderer with accessibility
  const renderFormField = (field: FieldConfig) => {
    const fieldError = fieldErrors[field.name];
    const hasError = !!fieldError && touchedFields.has(field.name);
    const value = formData[field.name]?.toString() || "";
    const isValid = value && !hasError;

    const Icon = field.icon;

    return (
      <div className="space-y-2" key={field.name}>
        <Label
          htmlFor={field.name}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {field.label}
          {field.required && (
            <span className="text-destructive" aria-label="wajib diisi">
              *
            </span>
          )}
        </Label>

        <div className="relative">
          {field.type === "textarea" ? (
            <Textarea
              id={field.name}
              name={field.name}
              value={value}
              onChange={handleInputChange}
              onBlur={handleFieldBlur}
              placeholder={field.placeholder}
              rows={4}
              maxLength={field.maxLength}
              aria-label={field.label}
              aria-describedby={`${field.name}-help ${field.name}-error`}
              aria-invalid={hasError}
              className={cn(
                "resize-none transition-all duration-200",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                hasError &&
                  "border-destructive focus:border-destructive focus:ring-destructive/20",
                isValid && "border-green-500",
              )}
              disabled={loading}
            />
          ) : (
            <Input
              id={field.name}
              name={field.name}
              type={field.type === "tel" ? "tel" : field.type}
              value={value}
              onChange={handleInputChange}
              onBlur={handleFieldBlur}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              aria-label={field.label}
              aria-describedby={`${field.name}-help ${field.name}-error`}
              aria-invalid={hasError}
              className={cn(
                "transition-all duration-200",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                hasError &&
                  "border-destructive focus:border-destructive focus:ring-destructive/20",
                isValid && "border-green-500",
              )}
              disabled={loading}
            />
          )}

          {isValid && (
            <CheckCircle
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500"
              aria-hidden="true"
            />
          )}
        </div>

        {field.maxLength && (field.type === "textarea" || field.type === "text") && (
          <p className="text-xs text-muted-foreground text-right">
            {value.length}/{field.maxLength}
          </p>
        )}

        {hasError && (
          <p
            id={`${field.name}-error`}
            className="flex items-center gap-1 text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {fieldError}
          </p>
        )}

        <p
          id={`${field.name}-help`}
          className="text-xs text-muted-foreground"
        >
          {field.helperText}
        </p>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm",
          className,
        )}
      >
        {/* Decorative background gradients */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl bg-blue-500/10" />
          <div className="absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full blur-2xl bg-green-500/10" />
        </div>

        {/* Enhanced Header with Status */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-b border-border/50 bg-background/60 p-6 backdrop-blur-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
                  isEditing
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? (
                  <Edit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                ) : (
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground md:text-2xl">
                  {isEditing ? "Edit Pengaduan" : "Formulir Pengaduan Bulanan"}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    {formValidation.filledFields}/{formValidation.totalFields}{" "}
                    Kolom
                  </Badge>

                  {autoSaveStatus === "saving" && (
                    <Badge
                      variant="default"
                      className="gap-1 text-xs animate-pulse"
                    >
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Menyimpan...
                    </Badge>
                  )}
                  {autoSaveStatus === "saved" && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Tersimpan
                    </Badge>
                  )}
                  {autoSaveStatus === "error" && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      Simpan gagal
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="w-full md:w-48">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Progres
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {formValidation.progress}%
                  </span>
                </div>
                <Progress value={formValidation.progress} className="h-2" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Form Content */}
        <motion.div variants={itemVariants} className="relative z-10 p-6">
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="space-y-8"
            noValidate
            aria-label="Formulir pengaduan bulanan"
          >
            {/* Main form sections */}
            <div className="space-y-8">
              {renderFormSection("basic", "Informasi Dasar", User)}
              {renderFormSection("complaint", "Detail Pengaduan", MessageSquare)}
              {renderFormSection("contact", "Informasi Kontak", Phone)}

              {/* Admin-only section */}
              {userRole === "admin" && (
                <motion.div
                  variants={itemVariants}
                  className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                      Aksi Admin
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="tindak_lanjut_pengaduan"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Tindak Lanjut
                    </Label>
                    <Textarea
                      id="tindak_lanjut_pengaduan"
                      name="tindak_lanjut_pengaduan"
                      value={formData.tindak_lanjut_pengaduan || ""}
                      onChange={handleInputChange}
                      placeholder="Catatan tindak lanjut dari admin..."
                      rows={3}
                      className="resize-none"
                      disabled={loading}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Form Actions */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 border-t border-border/50 pt-6 sm:flex-row sm:justify-between"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {success && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Berhasil disimpan!</span>
                  </div>
                )}
                {!formValidation.isValid && touchedFields.size > 0 && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {formValidation.totalFields -
                        formValidation.filledFields}{" "}
                      kolom tersisa
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={loading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Batal
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Batalkan dan abaikan perubahan</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={loading || !formValidation.isValid}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Simpan Perubahan
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Kirim Pengaduan
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!formValidation.isValid
                      ? "Lengkapi semua kolom wajib"
                      : isEditing
                        ? "Simpan perubahan Anda"
                        : "Kirim pengaduan Anda"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}