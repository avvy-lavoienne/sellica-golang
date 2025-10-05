"use client";

import type React from "react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { typo, textColors } from "@/lib/typography";
import type {
  SilpanaData,
  SilpanaFormData,
  PriorityLevel,
} from "@/types/silpana/silpana";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ListFilter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates NIK (Nomor Induk Kependudukan) - Indonesian National ID
 * @param nik - The NIK string to validate
 * @returns true if valid, error message string if invalid
 */
const validateNIK = (nik: string): string | true => {
  if (!nik || nik.trim() === '') return 'NIK wajib diisi';
  const cleanedNIK = nik.replace(/\D/g, '');
  if (cleanedNIK.length !== 16) return 'NIK harus 16 digit';
  if (!/^\d+$/.test(cleanedNIK)) return 'NIK hanya boleh berisi angka';
  return true;
};

/**
 * Validates Indonesian phone number
 * @param phone - The phone number to validate
 * @returns true if valid, error message string if invalid
 */
const validatePhone = (phone: string): string | true => {
  if (!phone || phone.trim() === '') return 'Nomor telepon wajib diisi';
  const cleanedPhone = phone.replace(/\D/g, '');
  // Indonesian phone numbers: 08xxxxxxxxxx or +628xxxxxxxxxx or 628xxxxxxxxxx
  const phoneRegex = /^(\+?62|0)[8][1-9][0-9]{6,9}$/;
  if (!phoneRegex.test(cleanedPhone.startsWith('+') ? phone : cleanedPhone)) {
    return 'Format: 08xxxxxxxxxx atau +628xxxxxxxxxx';
  }
  return true;
};

/**
 * Formats NIK with dashes for better readability
 * @param nik - The NIK to format
 * @returns Formatted NIK (e.g., 1234-5678-9012-3456)
 */
const formatNIK = (nik: string): string => {
  const cleaned = nik.replace(/\D/g, '');
  const match = cleaned.match(/(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
  if (match) {
    return [match[1], match[2], match[3], match[4]].filter(Boolean).join('-');
  }
  return cleaned;
};

/**
 * Formats phone number to Indonesian standard
 * @param phone - The phone number to format
 * @returns Cleaned phone number
 */
const formatPhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  // Convert 62xxx to 0xxx for display
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  }
  return cleaned;
};

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

// Enhanced interface with enterprise-grade features
interface SilpanaFormProps {
  /** Form data object */
  formData: SilpanaFormData;
  /** Form data setter */
  setFormData: React.Dispatch<React.SetStateAction<SilpanaFormData>>;
  /** Form submission handler */
  onSubmit: (e: React.FormEvent) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  loading: boolean;
  /** Edit mode flag */
  isEditing: boolean;
  /** Edit data for pre-filling */
  editData: SilpanaData | null;
  /** User role for permissions */
  userRole: string;
  /** Custom className */
  className?: string;
  /** Animation delay */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Auto-save functionality */
  enableAutoSave?: boolean;
  /** Auto-save handler */
  onAutoSave?: (data: SilpanaFormData) => void;
  /** Form validation errors */
  errors?: Record<string, string>;
  /** Success state */
  success?: boolean;
  /** Progress tracking */
  showProgress?: boolean;
  /** Submission progress for loading states */
  submissionProgress?: number;
  /** Enable multi-step wizard mode */
  enableMultiStep?: boolean;
}

// ============================================================================
// MULTI-STEP WIZARD CONFIGURATION
// ============================================================================

type FormStep = 'submission-type' | 'personal-info' | 'complaint-category' | 'complaint-details' | 'review';

interface StepConfig {
  id: FormStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedTime: string;
}

export default function SilpanaForm({
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
  submissionProgress = 0,
  enableMultiStep = true,
}: SilpanaFormProps) {
  // Enhanced state management for enterprise UX
  const [activeSection, setActiveSection] = useState<string>("basic");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [formProgress, setFormProgress] = useState(0);
  
  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState<FormStep>('submission-type');
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  const [visitedSteps, setVisitedSteps] = useState<Set<FormStep>>(new Set(['submission-type']));

  // Refs for enhanced functionality
  const formRef = useRef<HTMLFormElement>(null);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system for glass-morphism effects
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
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200 dark:border-blue-800",
        glowClass: "shadow-blue-500/20",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200 dark:border-green-800",
        glowClass: "shadow-green-500/20",
      },
    }),
    [],
  );

  // Dropdown options for kategori and sub-kategori
  const kategoriPengaduanOptions = [
    { value: "Pendaftaran Penduduk", label: "Pendaftaran Penduduk" },
    { value: "Pencatatan Sipil", label: "Pencatatan Sipil" }
  ];

  const getSubKategoriOptions = useCallback((kategori: string) => {
    if (kategori === "Pendaftaran Penduduk") {
      return [
        { value: "Kartu Tanda Penduduk", label: "Kartu Tanda Penduduk" },
        { value: "Kartu Keluarga", label: "Kartu Keluarga" },
        { value: "Perpindahan", label: "Perpindahan" }
      ];
    } else if (kategori === "Pencatatan Sipil") {
      return [
        { value: "Akta Kelahiran", label: "Akta Kelahiran" },
        { value: "Akta Kematian", label: "Akta Kematian" }
      ];
    }
    return [];
  }, []);

  // Multi-step wizard configuration
  const formSteps: StepConfig[] = useMemo(() => [
    {
      id: 'submission-type',
      title: 'Tipe Pengajuan',
      description: 'Pilih cara mengajukan',
      icon: Shield,
      estimatedTime: '30 detik',
    },
    {
      id: 'personal-info',
      title: 'Informasi Pribadi',
      description: 'Data diri pengadu',
      icon: User,
      estimatedTime: '1 menit',
    },
    {
      id: 'complaint-category',
      title: 'Kategori Pengaduan',
      description: 'Klasifikasi pengaduan',
      icon: ListFilter,
      estimatedTime: '1 menit',
    },
    {
      id: 'complaint-details',
      title: 'Detail Pengaduan',
      description: 'Rincian lengkap',
      icon: MessageSquare,
      estimatedTime: '2 menit',
    },
    {
      id: 'review',
      title: 'Tinjau & Kirim',
      description: 'Periksa kembali',
      icon: CheckCircle,
      estimatedTime: '30 detik',
    },
  ], []);

  // Get required fields for each step
  const getStepFields = useCallback((stepId: FormStep): string[] => {
    switch (stepId) {
      case 'submission-type':
        return ['is_anonymous'];
      case 'personal-info':
        return formData.is_anonymous 
          ? ['nama_pengaduan'] 
          : ['nik_pengaduan', 'nama_pengaduan', 'nomor_telepon'];
      case 'complaint-category':
        return ['kategori_pengaduan', 'sub_kategori_pengaduan'];
      case 'complaint-details':
        return ['alasan_pengaduan', 'deskripsi_pengaduan', 'tanggal_pengaduan'];
      case 'review':
        return [];
      default:
        return [];
    }
  }, [formData.is_anonymous]);

  // Check if a step is complete
  const isStepComplete = useCallback((stepId: FormStep): boolean => {
    const requiredFields = getStepFields(stepId);
    if (requiredFields.length === 0) return true; // No required fields = always complete
    
    return requiredFields.every(field => {
      const value = formData[field as keyof SilpanaFormData];
      if (typeof value === 'boolean') return true; // Boolean fields are always valid
      return value !== undefined && value !== null && value.toString().trim() !== '';
    });
  }, [formData, getStepFields]);

  // Check if current step is valid (can proceed)
  const canProceedToNextStep = useCallback((): boolean => {
    const currentStepFields = getStepFields(currentStep);
    
    // Check if all required fields are filled
    const allFieldsFilled = currentStepFields.every(field => {
      const value = formData[field as keyof SilpanaFormData];
      if (typeof value === 'boolean') return true;
      return value !== undefined && value !== null && value.toString().trim() !== '';
    });
    
    // Check if there are validation errors for current step fields
    const hasValidationErrors = currentStepFields.some(field => 
      fieldErrors[field] !== undefined
    );
    
    return allFieldsFilled && !hasValidationErrors;
  }, [currentStep, formData, fieldErrors, getStepFields]);

  // Get current step index
  const getCurrentStepIndex = useCallback(() => {
    return formSteps.findIndex(step => step.id === currentStep);
  }, [currentStep, formSteps]);

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < formSteps.length - 1 && canProceedToNextStep()) {
      const nextStep = formSteps[currentIndex + 1].id;
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, formSteps, getCurrentStepIndex, canProceedToNextStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const prevStep = formSteps[currentIndex - 1].id;
      setCurrentStep(prevStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [getCurrentStepIndex, formSteps]);

  // Navigate to specific step (only if already visited or next step is valid)
  const goToStep = useCallback((stepId: FormStep) => {
    const targetIndex = formSteps.findIndex(s => s.id === stepId);
    const currentIndex = getCurrentStepIndex();
    
    // Can go to any visited step, or next step if current is complete
    if (visitedSteps.has(stepId) || (targetIndex === currentIndex + 1 && canProceedToNextStep())) {
      setCurrentStep(stepId);
      setVisitedSteps(prev => new Set([...prev, stepId]));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formSteps, getCurrentStepIndex, visitedSteps, canProceedToNextStep]);

  // Form validation and progress calculation
  const formValidation = useMemo(() => {
    const requiredFields = formData.is_anonymous 
      ? [
          "nama_pengaduan",
          "kategori_pengaduan", 
          "sub_kategori_pengaduan",
          "alasan_pengaduan",
          "deskripsi_pengaduan",
          "tanggal_pengaduan",
        ]
      : [
          "nik_pengaduan",
          "nama_pengaduan",
          "kategori_pengaduan",
          "sub_kategori_pengaduan", 
          "alasan_pengaduan",
          "deskripsi_pengaduan",
          "nomor_telepon",
          "tanggal_pengaduan",
        ];
    
    const filledFields = requiredFields.filter((field) =>
      formData[field as keyof SilpanaFormData]?.toString().trim(),
    );
    const progress = (filledFields.length / requiredFields.length) * 100;

    // Enhanced validation with detailed error messages
    const validationErrors: Record<string, string> = {};
    
    // NIK validation (only if not anonymous and field is touched)
    if (!formData.is_anonymous && touchedFields.has('nik_pengaduan')) {
      const nikValidation = validateNIK(formData.nik_pengaduan || '');
      if (nikValidation !== true) {
        validationErrors.nik_pengaduan = nikValidation;
      }
    }
    
    // Phone validation (only if not anonymous and field is touched)
    if (!formData.is_anonymous && touchedFields.has('nomor_telepon')) {
      const phoneValidation = validatePhone(formData.nomor_telepon || '');
      if (phoneValidation !== true) {
        validationErrors.nomor_telepon = phoneValidation;
      }
    }

    // Name validation
    if (touchedFields.has('nama_pengaduan') && !formData.nama_pengaduan?.trim()) {
      validationErrors.nama_pengaduan = 'Nama pengaduan wajib diisi';
    }

    // Category validation
    if (touchedFields.has('kategori_pengaduan') && !formData.kategori_pengaduan) {
      validationErrors.kategori_pengaduan = 'Kategori pengaduan wajib dipilih';
    }

    // Sub-category validation
    if (touchedFields.has('sub_kategori_pengaduan') && !formData.sub_kategori_pengaduan) {
      validationErrors.sub_kategori_pengaduan = 'Sub kategori pengaduan wajib dipilih';
    }

    // Reason validation
    if (touchedFields.has('alasan_pengaduan') && !formData.alasan_pengaduan?.trim()) {
      validationErrors.alasan_pengaduan = 'Alasan pengaduan wajib diisi';
    }

    // Description validation with minimum length
    if (touchedFields.has('deskripsi_pengaduan')) {
      if (!formData.deskripsi_pengaduan?.trim()) {
        validationErrors.deskripsi_pengaduan = 'Deskripsi pengaduan wajib diisi';
      } else if (formData.deskripsi_pengaduan.length < 20) {
        validationErrors.deskripsi_pengaduan = 'Deskripsi minimal 20 karakter';
      }
    }

    // Date validation
    if (touchedFields.has('tanggal_pengaduan') && !formData.tanggal_pengaduan) {
      validationErrors.tanggal_pengaduan = 'Tanggal pengajuan wajib diisi';
    }

    const hasErrors = Object.keys(validationErrors).length > 0;
    const allFieldsFilled = filledFields.length === requiredFields.length;

    return {
      isValid: allFieldsFilled && !hasErrors,
      progress,
      filledFields: filledFields.length,
      totalFields: requiredFields.length,
      errors: validationErrors,
      hasErrors,
    };
  }, [formData, touchedFields]);

  // Update progress and sync validation errors
  useEffect(() => {
    setFormProgress(formValidation.progress);
    // Sync validation errors to field errors state
    if (formValidation.hasErrors) {
      setFieldErrors(prev => ({ ...prev, ...formValidation.errors }));
    }
  }, [formValidation.progress, formValidation.errors, formValidation.hasErrors]);

  // Set smart defaults on mount
  useEffect(() => {
    if (!isEditing) {
      // Set today's date as default
      if (!formData.tanggal_pengaduan) {
        const today = new Date().toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, tanggal_pengaduan: today }));
      }
      // Set medium priority as default
      if (!formData.priority_level) {
        setFormData(prev => ({ ...prev, priority_level: 'medium' as PriorityLevel }));
      }
    }
  }, [isEditing, formData.tanggal_pengaduan, formData.priority_level, setFormData]);

  // Merge external errors with field errors
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      setFieldErrors(prev => ({ ...prev, ...errors }));
      
      // Focus on first error field if available
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && firstErrorRef.current) {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
        if (errorElement) {
          errorElement.focus();
        }
      }
    }
  }, [errors]);

  // Enhanced input change handler with validation and auto-formatting
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Apply smart formatting for specific fields
      let formattedValue = value;
      
      if (name === 'nik_pengaduan') {
        // Remove non-digits and limit to 16 characters
        formattedValue = value.replace(/\D/g, '').slice(0, 16);
      } else if (name === 'nomor_telepon') {
        // Format phone number
        formattedValue = formatPhone(value);
      }

      // Update form data with formatted value
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));

      // Mark field as touched for validation
      setTouchedFields((prev) => new Set([...prev, name]));

      // Clear specific field error when user starts typing
      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      // Auto-save functionality with debounce
      if (enableAutoSave && onAutoSave) {
        setAutoSaveStatus("saving");
        const timeoutId = setTimeout(() => {
          onAutoSave({ ...formData, [name]: formattedValue });
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    },
    [formData, fieldErrors, enableAutoSave, onAutoSave, setFormData],
  );

  // Enhanced select change handler
  const handleSelectChange = useCallback(
    (name: string, value: string) => {
      // Update form data
      setFormData((prev) => {
        const newData = { ...prev, [name]: value };
        
        // If kategori_pengaduan changes, reset sub_kategori_pengaduan
        if (name === "kategori_pengaduan") {
          newData.sub_kategori_pengaduan = "";
        }
        
        return newData;
      });

      // Mark field as touched
      setTouchedFields((prev) => new Set([...prev, name]));

      // Clear field error when user selects value
      if (fieldErrors[name]) {
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }

      // Auto-save functionality
      if (enableAutoSave && onAutoSave) {
        setAutoSaveStatus("saving");
        const timeoutId = setTimeout(() => {
          const updatedData = { ...formData, [name]: value };
          if (name === "kategori_pengaduan") {
            updatedData.sub_kategori_pengaduan = "";
          }
          onAutoSave(updatedData);
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    },
    [formData, fieldErrors, enableAutoSave, onAutoSave, setFormData],
  );

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldAnimate ? 0.6 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800",
          className,
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Background decoration - keeping for visual interest */}
        <div className="absolute inset-0 opacity-30">
          <div
            className={cn(
              "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
              colorSchemes.blue.bgClass,
              "opacity-20",
            )}
          />
          <div
            className={cn(
              "absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full blur-2xl",
              colorSchemes.green.bgClass,
              "opacity-20",
            )}
          />
        </div>

        {/* Enhanced Header - Flowbite pattern */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-b border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <div className="flex flex-col gap-4 laptop:flex-row laptop:items-center laptop:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
                  isEditing
                    ? colorSchemes.blue.bgClass
                    : colorSchemes.green.bgClass,
                  isEditing
                    ? colorSchemes.blue.borderClass
                    : colorSchemes.green.borderClass,
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isEditing ? (
                  <Edit className={cn("h-6 w-6", colorSchemes.blue.accent)} />
                ) : (
                  <FileText
                    className={cn("h-6 w-6", colorSchemes.green.accent)}
                  />
                )}
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditing ? "Edit Data SILPANA" : "Form Input SILPANA"}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Target className="h-3 w-3" />
                    {formValidation.filledFields}/{formValidation.totalFields}{" "}
                    Fields
                  </Badge>
                  {formData.is_anonymous && (
                    <Badge variant="default" className="gap-1 border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                      <Shield className="h-3 w-3" />
                      Anonymous
                    </Badge>
                  )}
                  {showProgress && (
                    <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      <TrendingUp className="h-3 w-3" />
                      {Math.round(formProgress)}% Complete
                    </Badge>
                  )}
                  {autoSaveStatus === "saving" && (
                    <Badge variant="default" className="gap-1 border-blue-200 bg-blue-600 text-white dark:border-blue-800 dark:bg-blue-700">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </Badge>
                  )}
                  {autoSaveStatus === "saved" && (
                    <Badge variant="default" className="gap-1 border-green-200 bg-green-600 text-white dark:border-green-800 dark:bg-green-700">
                      <CheckCircle className="h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar - Flowbite colors */}
            {showProgress && (
              <div className="w-full laptop:w-48">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {loading ? "Submitting" : "Progress"}
                  </span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {Math.round(loading ? submissionProgress : formProgress)}%
                  </span>
                </div>
                <Progress 
                  value={loading ? submissionProgress : formProgress} 
                  className={cn(
                    "h-2 transition-all duration-300",
                    loading && "bg-blue-100 dark:bg-blue-900"
                  )}
                />
                {loading && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Mengirim pengaduan...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Form Content */}
        <motion.div variants={itemVariants} className="relative z-10 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Error Summary */}
            {Object.keys(fieldErrors).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="flex-1">
                    <h4 className="mb-2 font-medium text-red-800 dark:text-red-400">
                      Harap perbaiki kesalahan berikut:
                    </h4>
                    <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                      {Object.entries(fieldErrors).map(([field, error]) => (
                        <li key={field} className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-red-500 dark:bg-red-400" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Multi-Step Progress Indicator */}
            {enableMultiStep && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-900/20"
              >
                {/* Step Counter & Time */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-blue-700">
                      <span className="text-sm font-bold">{getCurrentStepIndex() + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Langkah {getCurrentStepIndex() + 1} dari {formSteps.length}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Estimasi: {formSteps[getCurrentStepIndex()].estimatedTime}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    {Math.round((getCurrentStepIndex() / (formSteps.length - 1)) * 100)}% Selesai
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-6">
                  <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-border/30 rounded-full">
                    <motion.div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(getCurrentStepIndex() / (formSteps.length - 1)) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                  </div>

                  {/* Step Dots */}
                  <div className="relative flex justify-between">
                    {formSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isActive = step.id === currentStep;
                      const isCompleted = completedSteps.has(step.id);
                      const isVisited = visitedSteps.has(step.id);
                      const canAccess = isVisited || (index === getCurrentStepIndex() + 1 && canProceedToNextStep());
                      
                      return (
                        <div key={step.id} className="relative flex flex-col items-center gap-2">
                          <button
                            type="button"
                            onClick={() => goToStep(step.id)}
                            disabled={!canAccess}
                            className={cn(
                              "group relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                              "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2",
                              isActive && "scale-110 border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30 dark:border-blue-500 dark:bg-blue-500",
                              isCompleted && !isActive && "border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400",
                              !isActive && !isCompleted && !isVisited && "border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
                              !isActive && !isCompleted && isVisited && "border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                              canAccess && "cursor-pointer hover:scale-105",
                              !canAccess && "cursor-not-allowed opacity-50"
                            )}
                            aria-label={`${step.title}: ${step.description}`}
                            aria-current={isActive ? "step" : undefined}
                          >
                            {isCompleted && !isActive ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <StepIcon className="h-5 w-5" />
                            )}
                          </button>

                          {/* Step Label */}
                          <div className="text-center max-w-[80px]">
                            <p className={cn(
                              "text-[10px] font-medium transition-colors leading-tight",
                              isActive && "text-blue-600 dark:text-blue-400",
                              isCompleted && !isActive && "text-green-600 dark:text-green-400",
                              !isActive && !isCompleted && "text-gray-600 dark:text-gray-400"
                            )}>
                              {step.title}
                            </p>
                          </div>

                          {/* Active Step Pulse */}
                          {isActive && (
                            <motion.div
                              className="absolute top-0 h-10 w-10 rounded-full bg-blue-500/20 dark:bg-blue-400/20"
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Step Info */}
                <div className="rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-gray-800/60">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formSteps[getCurrentStepIndex()].title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formSteps[getCurrentStepIndex()].description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Enhanced Form Section */}
            <motion.div
              variants={itemVariants}
              className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 p-6 shadow-sm backdrop-blur-sm"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-30">
                <div
                  className={cn(
                    "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl",
                    colorSchemes.primary.bgClass,
                    "opacity-20",
                  )}
                />
              </div>

              <div className="relative z-10 space-y-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Submission Type */}
                  {(!enableMultiStep || currentStep === 'submission-type') && (
                    <motion.div
                      key="submission-type"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          Opsi Pengajuan
                        </h4>
                      </div>

                      <div className="flex items-start space-x-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="is_anonymous"
                            name="is_anonymous"
                            checked={formData.is_anonymous || false}
                            onChange={(e) => {
                              const isAnonymous = e.target.checked;
                              setFormData((prev) => ({ 
                                ...prev, 
                                is_anonymous: isAnonymous,
                                // Clear personal fields if going anonymous
                                ...(isAnonymous ? {
                                  nik_pengaduan: "",
                                  nomor_telepon: ""
                                } : {})
                              }));
                              setTouchedFields((prev) => new Set([...prev, "is_anonymous"]));
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700"
                          />
                          <Label 
                            htmlFor="is_anonymous" 
                            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                          >
                            <Shield className="h-4 w-4" />
                            Ajukan sebagai Anonim
                          </Label>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Centang opsi ini jika Anda ingin mengajukan pengaduan secara anonim. 
                            Data pribadi seperti NIK dan nomor telepon tidak akan diperlukan.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Personal Information - Only show in multi-step OR always in single page */}
                  {(!enableMultiStep || currentStep === 'personal-info') && (
                    <motion.div
                      key="personal-info"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          Informasi Dasar
                        </h4>
                      </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* NIK Pengaduan Field - Only show if not anonymous */}
                    {!formData.is_anonymous && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="nik_pengaduan"
                          className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                          <User className="h-4 w-4" />
                          NIK Pengaduan
                          <span className="text-red-600 dark:text-red-400">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="nik_pengaduan"
                            name="nik_pengaduan"
                            type="text"
                            value={formData.nik_pengaduan}
                            onChange={handleInputChange}
                            placeholder="Masukkan NIK (16 digit)"
                            className={cn(
                              "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              fieldErrors.nik_pengaduan && "border-red-500 ring-2 ring-red-500/20 dark:border-red-500",
                              formData.nik_pengaduan && !fieldErrors.nik_pengaduan && "border-green-500 dark:border-green-500",
                            )}
                            required={!formData.is_anonymous}
                            maxLength={16}
                            aria-invalid={!!fieldErrors.nik_pengaduan}
                            aria-describedby={fieldErrors.nik_pengaduan ? "nik-error" : "nik-helper"}
                          />
                          {formData.nik_pengaduan && !fieldErrors.nik_pengaduan && (
                            <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                          )}
                          {fieldErrors.nik_pengaduan && (
                            <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500 dark:text-red-400" />
                          )}
                        </div>
                        {fieldErrors.nik_pengaduan && (
                          <p id="nik-error" className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400" role="alert">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.nik_pengaduan}
                          </p>
                        )}
                        <p id="nik-helper" className="text-xs text-gray-600 dark:text-gray-400">
                          Masukkan NIK 16 digit sesuai KTP
                        </p>
                      </div>
                    )}

                    {/* Nama Pengaduan Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="nama_pengaduan"
                        className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        <FileText className="h-4 w-4" />
                        Nama Pengaduan
                        <span className="text-red-600 dark:text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="nama_pengaduan"
                          name="nama_pengaduan"
                          type="text"
                          value={formData.nama_pengaduan}
                          onChange={handleInputChange}
                          placeholder="Masukkan nama pengaduan"
                          className={cn(
                            "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                            touchedFields.has("nama_pengaduan") &&
                              !formData.nama_pengaduan &&
                              "border-red-500 dark:border-red-500",
                            formData.nama_pengaduan && "border-green-500 dark:border-green-500",
                          )}
                          required
                        />
                        {formData.nama_pengaduan && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                        )}
                      </div>
                      {touchedFields.has("nama_pengaduan") &&
                        !formData.nama_pengaduan && (
                          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Nama pengaduan wajib diisi
                          </p>
                        )}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Judul singkat untuk pengaduan Anda
                      </p>
                    </div>

                    {/* Kategori Pengaduan Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="kategori_pengaduan"
                        className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        <ListFilter className="h-4 w-4" />
                        Kategori Pengaduan
                        <span className="text-red-600 dark:text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Select
                          value={formData.kategori_pengaduan}
                          onValueChange={(value) => handleSelectChange("kategori_pengaduan", value)}
                        >
                          <SelectTrigger
                            id="kategori_pengaduan"
                            className={cn(
                              "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              touchedFields.has("kategori_pengaduan") &&
                                !formData.kategori_pengaduan &&
                                "border-red-500 dark:border-red-500",
                              formData.kategori_pengaduan && "border-green-500 dark:border-green-500",
                            )}
                          >
                            <SelectValue placeholder="Pilih kategori pengaduan" />
                          </SelectTrigger>
                          <SelectContent>
                            {kategoriPengaduanOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.kategori_pengaduan && (
                          <CheckCircle className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                        )}
                      </div>
                      {touchedFields.has("kategori_pengaduan") &&
                        !formData.kategori_pengaduan && (
                          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Kategori pengaduan wajib dipilih
                          </p>
                        )}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Pilih kategori yang sesuai dengan pengaduan Anda
                      </p>
                    </div>

                    {/* Sub Kategori Pengaduan Field - Shows only when kategori is selected */}
                    {formData.kategori_pengaduan && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="sub_kategori_pengaduan"
                          className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                          <Target className="h-4 w-4" />
                          Sub Kategori Pengaduan
                          <span className="text-red-600 dark:text-red-400">*</span>
                        </Label>
                        <div className="relative">
                          <Select
                            value={formData.sub_kategori_pengaduan}
                            onValueChange={(value) => handleSelectChange("sub_kategori_pengaduan", value)}
                          >
                            <SelectTrigger
                              id="sub_kategori_pengaduan"
                              className={cn(
                                "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                                touchedFields.has("sub_kategori_pengaduan") &&
                                  !formData.sub_kategori_pengaduan &&
                                  "border-red-500 dark:border-red-500",
                                formData.sub_kategori_pengaduan && "border-green-500 dark:border-green-500",
                              )}
                            >
                              <SelectValue placeholder="Pilih sub kategori pengaduan" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSubKategoriOptions(formData.kategori_pengaduan).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formData.sub_kategori_pengaduan && (
                            <CheckCircle className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                          )}
                        </div>
                        {touchedFields.has("sub_kategori_pengaduan") &&
                          !formData.sub_kategori_pengaduan && (
                            <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                              <AlertCircle className="h-3 w-3" />
                              Sub kategori pengaduan wajib dipilih
                            </p>
                          )}
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Pilih sub kategori yang lebih spesifik
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Priority Level Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="priority_level"
                      className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Tingkat Prioritas
                      <span className="text-xs text-gray-600 dark:text-gray-400">(Opsional)</span>
                    </Label>
                    <div className="relative">
                      <Select
                        value={formData.priority_level || 'medium'}
                        onValueChange={(value) => handleSelectChange("priority_level", value as PriorityLevel)}
                      >
                        <SelectTrigger
                          id="priority_level"
                          className={cn(
                            "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                            formData.priority_level && "border-green-500 dark:border-green-500",
                          )}
                        >
                          <SelectValue placeholder="Pilih tingkat prioritas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500"></div>
                              Rendah - Tidak mendesak
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                              Sedang - Normal
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                              Tinggi - Perlu perhatian
                            </div>
                          </SelectItem>
                          <SelectItem value="critical">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500"></div>
                              Kritis - Sangat mendesak
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.priority_level && (
                        <CheckCircle className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Sistem akan menentukan prioritas secara otomatis berdasarkan kategori jika tidak dipilih
                    </p>
                  </div>
                    </motion.div>
                  )}

                  {/* Step 3: Complaint Details - Reason & Description & Date */}
                  {(!enableMultiStep || currentStep === 'complaint-details') && (
                    <motion.div
                      key="complaint-details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Detail Pengaduan
                    </h4>
                  </div>

                  {/* Alasan Pengaduan Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="alasan_pengaduan"
                      className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Alasan Pengaduan
                      <span className="text-red-600 dark:text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="alasan_pengaduan"
                        name="alasan_pengaduan"
                        type="text"
                        value={formData.alasan_pengaduan}
                        onChange={handleInputChange}
                        placeholder="Masukkan alasan pengaduan"
                        className={cn(
                          "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                          touchedFields.has("alasan_pengaduan") &&
                            !formData.alasan_pengaduan &&
                            "border-red-500 dark:border-red-500",
                          formData.alasan_pengaduan && "border-green-500 dark:border-green-500",
                        )}
                        required
                      />
                      {formData.alasan_pengaduan && (
                        <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                      )}
                    </div>
                    {touchedFields.has("alasan_pengaduan") &&
                      !formData.alasan_pengaduan && (
                        <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          Alasan pengaduan wajib diisi
                        </p>
                      )}
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Alasan utama pengaduan Anda
                    </p>
                  </div>

                  {/* Deskripsi Pengaduan Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="deskripsi_pengaduan"
                      className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      <FileText className="h-4 w-4" />
                      Deskripsi Pengaduan
                      <span className="text-red-600 dark:text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="deskripsi_pengaduan"
                        name="deskripsi_pengaduan"
                        value={formData.deskripsi_pengaduan}
                        onChange={handleInputChange}
                        placeholder="Jelaskan secara detail pengaduan Anda... (minimal 20 karakter)"
                        rows={4}
                        className={cn(
                          "resize-none rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                          fieldErrors.deskripsi_pengaduan && "border-red-500 ring-2 ring-red-500/20 dark:border-red-500",
                          formData.deskripsi_pengaduan && 
                            formData.deskripsi_pengaduan.length >= 20 && 
                            !fieldErrors.deskripsi_pengaduan && 
                            "border-green-500 dark:border-green-500",
                        )}
                        required
                        aria-invalid={!!fieldErrors.deskripsi_pengaduan}
                        aria-describedby={fieldErrors.deskripsi_pengaduan ? "description-error" : "description-helper"}
                      />
                      {formData.deskripsi_pengaduan && 
                       formData.deskripsi_pengaduan.length >= 20 && 
                       !fieldErrors.deskripsi_pengaduan && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500 dark:text-green-400" />
                      )}
                      {fieldErrors.deskripsi_pengaduan && (
                        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    {fieldErrors.deskripsi_pengaduan && (
                      <p id="description-error" className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400" role="alert">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.deskripsi_pengaduan}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p id="description-helper" className="text-xs text-gray-600 dark:text-gray-400">
                        Berikan informasi detail tentang pengaduan Anda (minimal 20 karakter)
                      </p>
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        formData.deskripsi_pengaduan?.length < 20 && touchedFields.has("deskripsi_pengaduan")
                          ? "text-amber-600 dark:text-amber-400"
                          : formData.deskripsi_pengaduan?.length >= 20
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400"
                      )}>
                        {formData.deskripsi_pengaduan?.length || 0} / 20 karakter
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Informasi Kontak
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Nomor Telepon Field - Only show if not anonymous */}
                    {!formData.is_anonymous && (
                      <div className="space-y-2">
                        <Label
                          htmlFor="nomor_telepon"
                          className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                        >
                          <Phone className="h-4 w-4" />
                          Nomor Telepon
                          <span className="text-red-600 dark:text-red-400">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="nomor_telepon"
                            name="nomor_telepon"
                            type="tel"
                            value={formData.nomor_telepon}
                            onChange={handleInputChange}
                            placeholder="08xxxxxxxxxx"
                            className={cn(
                              "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                              fieldErrors.nomor_telepon && "border-red-500 ring-2 ring-red-500/20 dark:border-red-500",
                              formData.nomor_telepon && !fieldErrors.nomor_telepon && "border-green-500 dark:border-green-500",
                            )}
                            required={!formData.is_anonymous}
                            aria-invalid={!!fieldErrors.nomor_telepon}
                            aria-describedby={fieldErrors.nomor_telepon ? "phone-error" : "phone-helper"}
                          />
                          {formData.nomor_telepon && !fieldErrors.nomor_telepon && (
                            <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                          )}
                          {fieldErrors.nomor_telepon && (
                            <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        {fieldErrors.nomor_telepon && (
                          <p id="phone-error" className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400" role="alert">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.nomor_telepon}
                          </p>
                        )}
                        <p id="phone-helper" className="text-xs text-gray-600 dark:text-gray-400">
                          Format: 08xxxxxxxxxx (nomor HP Indonesia)
                        </p>
                      </div>
                    )}

                    {/* Tanggal Pengajuan Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="tanggal_pengajuan"
                        className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        <Calendar className="h-4 w-4" />
                        Tanggal Pengajuan
                        <span className="text-red-600 dark:text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="tanggal_pengajuan"
                          name="tanggal_pengaduan"
                          type="date"
                          value={formData.tanggal_pengaduan}
                          onChange={handleInputChange}
                          className={cn(
                            "rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                            touchedFields.has("tanggal_pengaduan") &&
                              !formData.tanggal_pengaduan &&
                              "border-red-500 dark:border-red-500",
                            formData.tanggal_pengaduan && "border-green-500 dark:border-green-500",
                          )}
                          required
                        />
                        {formData.tanggal_pengaduan && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500 dark:text-green-400" />
                        )}
                      </div>
                      {touchedFields.has("tanggal_pengaduan") &&
                        !formData.tanggal_pengaduan && (
                          <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Tanggal pengajuan wajib diisi
                          </p>
                        )}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Tanggal saat Anda mengajukan pengaduan ini
                      </p>
                    </div>
                  </div>
                </div>
                    </motion.div>
                  )}

                  {/* Step 4: Review (shown in review step or always in single-page mode) */}
                  {(!enableMultiStep || currentStep === 'review') && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-6 dark:from-green-950/20 dark:to-emerald-950/20">
                        <div className="mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                            Tinjau Data Anda
                          </h4>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                          Pastikan semua informasi yang Anda berikan sudah benar sebelum mengirim pengaduan.
                        </p>
                        <div className="space-y-3 rounded-lg bg-white/60 p-4 dark:bg-gray-900/40">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-600 dark:text-gray-400">Status:</p>
                              <p className="text-gray-900 dark:text-white">{formData.is_anonymous ? '🔒 Anonim' : '👤 Dengan Identitas'}</p>
                            </div>
                            {!formData.is_anonymous && formData.nik_pengaduan && (
                              <div>
                                <p className="font-medium text-gray-600 dark:text-gray-400">NIK:</p>
                                <p className="text-gray-900 dark:text-white">{formData.nik_pengaduan}</p>
                              </div>
                            )}
                            {formData.nama_pengaduan && (
                              <div>
                                <p className="font-medium text-gray-600 dark:text-gray-400">Nama:</p>
                                <p className="text-gray-900 dark:text-white">{formData.nama_pengaduan}</p>
                              </div>
                            )}
                            {formData.kategori_pengaduan && (
                              <div>
                                <p className="font-medium text-gray-600 dark:text-gray-400">Kategori:</p>
                                <p className="text-gray-900 dark:text-white">{formData.kategori_pengaduan}</p>
                              </div>
                            )}
                            {formData.sub_kategori_pengaduan && (
                              <div>
                                <p className="font-medium text-gray-600 dark:text-gray-400">Sub Kategori:</p>
                                <p className="text-gray-900 dark:text-white">{formData.sub_kategori_pengaduan}</p>
                              </div>
                            )}
                            {formData.priority_level && (
                              <div>
                                <p className="font-medium text-gray-600 dark:text-gray-400">Prioritas:</p>
                                <p className="text-gray-900 dark:text-white capitalize">{formData.priority_level}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admin Section - Always visible for admin */}
                {userRole === "admin" && (
                  <div className="space-y-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Aksi Admin
                      </h4>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Shield className="h-3 w-3" />
                        Khusus Admin
                      </Badge>
                    </div>

                    {/* Tindak Lanjut Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="tindak_lanjut_pengaduan"
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Tindak Lanjut Pengaduan
                      </Label>
                      <div className="relative">
                        <Textarea
                          id="tindak_lanjut_pengaduan"
                          name="tindak_lanjut_pengaduan"
                          value={formData.tindak_lanjut_pengaduan}
                          onChange={handleInputChange}
                          placeholder="Tindak lanjut dari pengaduan (diisi oleh admin)..."
                          rows={3}
                          className={cn(
                            "resize-none rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
                            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                            formData.tindak_lanjut_pengaduan &&
                              "border-green-500 dark:border-green-500",
                          )}
                        />
                        {formData.tindak_lanjut_pengaduan && (
                          <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500 dark:text-green-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Tindak lanjut atau detail penyelesaian
                        </p>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formData.tindak_lanjut_pengaduan?.length || 0}{" "}
                          karakter
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Enhanced Form Actions with Multi-Step Navigation */}
            <motion.div
              variants={itemVariants}
              className="sticky bottom-0 z-20 -mx-6 -mb-6 border-t border-gray-200 bg-white/95 p-4 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Navigation Buttons */}
                {enableMultiStep ? (
                  <>
                    {/* Left: Back Button */}
                    <div className="flex gap-3">
                      {getCurrentStepIndex() > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={goToPreviousStep}
                          disabled={loading}
                          className="rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Kembali
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onCancel}
                        disabled={loading}
                        className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Batal
                      </Button>
                    </div>

                    {/* Right: Next/Submit Button */}
                    <div className="flex flex-1 items-center justify-end gap-3">
                      {/* Progress indicator */}
                      <div className="hidden text-sm text-gray-600 dark:text-gray-400 sm:block">
                        <span className="font-medium text-gray-900 dark:text-white">{getCurrentStepIndex() + 1}</span>
                        {" "}dari{" "}
                        <span className="font-medium text-gray-900 dark:text-white">{formSteps.length}</span>
                      </div>

                      {getCurrentStepIndex() < formSteps.length - 1 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              onClick={goToNextStep}
                              disabled={!canProceedToNextStep() || loading}
                              className={cn(
                                "min-w-[140px] rounded-lg bg-blue-700 text-white transition-all duration-200 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
                                !canProceedToNextStep() && "cursor-not-allowed opacity-50"
                              )}
                            >
                              Selanjutnya
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {!canProceedToNextStep()
                                ? "Lengkapi field yang wajib diisi untuk melanjutkan"
                                : `Lanjut ke ${formSteps[getCurrentStepIndex() + 1].title}`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="submit"
                              disabled={loading || !formValidation.isValid}
                              className={cn(
                                "min-w-[140px] rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white transition-all duration-200 hover:from-green-700 hover:to-emerald-700 focus:ring-4 focus:ring-green-300 dark:focus:ring-green-800",
                                loading && "cursor-not-allowed",
                              )}
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Mengirim...
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
                            <p>
                              {loading
                                ? "Mengirim pengaduan Anda..."
                                : !formValidation.isValid
                                  ? "Mohon lengkapi semua field yang wajib diisi"
                                  : "Kirim pengaduan Anda"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </>
                ) : (
                  // Single-page mode: Original buttons
                  <>
                    <div className="flex gap-3 sm:order-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={loading}
                            className="rounded-lg border-gray-300 bg-white text-gray-900 transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Batal
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Batal dan buang perubahan</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="submit"
                            disabled={loading || !formValidation.isValid}
                            className={cn(
                              "rounded-lg bg-blue-700 text-white transition-all duration-200 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
                              loading && "cursor-not-allowed",
                            )}
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
                                Kirim Data SILPANA
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {loading
                              ? "Memproses permintaan Anda..."
                              : !formValidation.isValid
                                ? "Mohon lengkapi semua field yang wajib diisi"
                                : isEditing
                                  ? "Simpan perubahan Anda"
                                  : "Kirim data SILPANA Anda"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </>
                )}
              </div>

              {/* Form Status */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 sm:order-1">
                {success && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Form berhasil dikirim!</span>
                  </div>
                )}
                {!formValidation.isValid && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {formValidation.totalFields - formValidation.filledFields}{" "}
                      field tersisa
                    </span>
                  </div>
                )}
                {autoSaveStatus === "saving" && (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Menyimpan otomatis...</span>
                  </div>
                )}
                {autoSaveStatus === "saved" && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Tersimpan otomatis</span>
                  </div>
                )}
              </div>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}