"use client";

import type React from "react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
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

// Enhanced interface with enterprise-grade features
interface PengaduanBulananFormProps {
  /** Form data object */
  formData: PengaduanBulananFormData;
  /** Form data setter */
  setFormData: React.Dispatch<React.SetStateAction<PengaduanBulananFormData>>;
  /** Form submission handler */
  onSubmit: (e: React.FormEvent) => void;
  /** Cancel handler */
  onCancel: () => void;
  /** Loading state */
  loading: boolean;
  /** Edit mode flag */
  isEditing: boolean;
  /** Edit data for pre-filling */
  editData: PengaduanBulananData | null;
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
  onAutoSave?: (data: PengaduanBulananFormData) => void;
  /** Form validation errors */
  errors?: Record<string, string>;
  /** Success state */
  success?: boolean;
  /** Progress tracking */
  showProgress?: boolean;
}

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

  // Form validation and progress calculation
  const formValidation = useMemo(() => {
    const requiredFields = [
      "nik_pengaduan",
      "nama_pengaduan",
      "alasan_pengaduan",
      "deskripsi_pengaduan",
      "nomor_telepon",
      "tanggal_pengaduan",
    ];
    const filledFields = requiredFields.filter((field) =>
      formData[field as keyof PengaduanBulananFormData]?.toString().trim(),
    );
    const progress = (filledFields.length / requiredFields.length) * 100;

    return {
      isValid: filledFields.length === requiredFields.length,
      progress,
      filledFields: filledFields.length,
      totalFields: requiredFields.length,
    };
  }, [formData]);

  // Update progress
  useEffect(() => {
    setFormProgress(formValidation.progress);
  }, [formValidation.progress]);

  // Enhanced input change handler with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Update form data
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Mark field as touched
      setTouchedFields((prev) => new Set([...prev, name]));

      // Clear field error when user starts typing
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
          onAutoSave({ ...formData, [name]: value });
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
          "relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm",
          className,
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-50">
          <div
            className={cn(
              "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
              colorSchemes.blue.bgClass,
              "opacity-30",
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

        {/* Enhanced Header */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-b border-border/50 bg-background/60 p-6 backdrop-blur-sm"
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
                <h3 className="text-xl font-bold text-foreground laptop:text-2xl">
                  {isEditing ? "Edit Pengaduan" : "Form Pengaduan Bulanan"}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    {formValidation.filledFields}/{formValidation.totalFields}{" "}
                    Fields
                  </Badge>
                  {showProgress && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      {Math.round(formProgress)}% Complete
                    </Badge>
                  )}
                  {autoSaveStatus === "saving" && (
                    <Badge variant="default" className="gap-1 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </Badge>
                  )}
                  {autoSaveStatus === "saved" && (
                    <Badge variant="default" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {showProgress && (
              <div className="w-full laptop:w-48">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Progress
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {Math.round(formProgress)}%
                  </span>
                </div>
                <Progress value={formProgress} className="h-2" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Form Content */}
        <motion.div variants={itemVariants} className="relative z-10 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
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
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">
                      Basic Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* NIK Pengaduan Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="nik_pengaduan"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        NIK Pengaduan
                        <span className="text-destructive">*</span>
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
                            "transition-all duration-200",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            touchedFields.has("nik_pengaduan") &&
                              !formData.nik_pengaduan &&
                              "border-destructive",
                            formData.nik_pengaduan && "border-green-500",
                          )}
                          required
                          maxLength={16}
                        />
                        {formData.nik_pengaduan && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                        )}
                      </div>
                      {touchedFields.has("nik_pengaduan") &&
                        !formData.nik_pengaduan && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            NIK is required
                          </p>
                        )}
                      <p className="text-xs text-muted-foreground">
                        Enter your 16-digit National ID number
                      </p>
                    </div>

                    {/* Nama Pengaduan Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="nama_pengaduan"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Nama Pengaduan
                        <span className="text-destructive">*</span>
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
                            "transition-all duration-200",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            touchedFields.has("nama_pengaduan") &&
                              !formData.nama_pengaduan &&
                              "border-destructive",
                            formData.nama_pengaduan && "border-green-500",
                          )}
                          required
                        />
                        {formData.nama_pengaduan && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                        )}
                      </div>
                      {touchedFields.has("nama_pengaduan") &&
                        !formData.nama_pengaduan && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            Complaint name is required
                          </p>
                        )}
                      <p className="text-xs text-muted-foreground">
                        Brief title for your complaint
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complaint Details Section */}
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">
                      Complaint Details
                    </h4>
                  </div>

                  {/* Alasan Pengaduan Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="alasan_pengaduan"
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Alasan Pengaduan
                      <span className="text-destructive">*</span>
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
                          "transition-all duration-200",
                          "focus:border-primary focus:ring-2 focus:ring-primary/20",
                          touchedFields.has("alasan_pengaduan") &&
                            !formData.alasan_pengaduan &&
                            "border-destructive",
                          formData.alasan_pengaduan && "border-green-500",
                        )}
                        required
                      />
                      {formData.alasan_pengaduan && (
                        <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                      )}
                    </div>
                    {touchedFields.has("alasan_pengaduan") &&
                      !formData.alasan_pengaduan && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          Complaint reason is required
                        </p>
                      )}
                    <p className="text-xs text-muted-foreground">
                      Main reason for your complaint
                    </p>
                  </div>

                  {/* Deskripsi Pengaduan Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="deskripsi_pengaduan"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Deskripsi Pengaduan
                      <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        id="deskripsi_pengaduan"
                        name="deskripsi_pengaduan"
                        value={formData.deskripsi_pengaduan}
                        onChange={handleInputChange}
                        placeholder="Jelaskan secara detail pengaduan Anda..."
                        rows={4}
                        className={cn(
                          "resize-none transition-all duration-200",
                          "focus:border-primary focus:ring-2 focus:ring-primary/20",
                          touchedFields.has("deskripsi_pengaduan") &&
                            !formData.deskripsi_pengaduan &&
                            "border-destructive",
                          formData.deskripsi_pengaduan && "border-green-500",
                        )}
                        required
                      />
                      {formData.deskripsi_pengaduan && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {touchedFields.has("deskripsi_pengaduan") &&
                      !formData.deskripsi_pengaduan && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          Complaint description is required
                        </p>
                      )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Provide detailed information about your complaint
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formData.deskripsi_pengaduan?.length || 0} characters
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">
                      Contact Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Nomor Telepon Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="nomor_telepon"
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Nomor Telepon
                        <span className="text-destructive">*</span>
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
                            "transition-all duration-200",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            touchedFields.has("nomor_telepon") &&
                              !formData.nomor_telepon &&
                              "border-destructive",
                            formData.nomor_telepon && "border-green-500",
                          )}
                          required
                        />
                        {formData.nomor_telepon && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                        )}
                      </div>
                      {touchedFields.has("nomor_telepon") &&
                        !formData.nomor_telepon && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            Phone number is required
                          </p>
                        )}
                      <p className="text-xs text-muted-foreground">
                        Format: 08xxxxxxxxxx (Indonesian mobile number)
                      </p>
                    </div>

                    {/* Tanggal Pengajuan Field */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="tanggal_pengajuan"
                        className="flex items-center gap-2"
                      >
                        <Calendar className="h-4 w-4" />
                        Tanggal Pengajuan
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="tanggal_pengajuan"
                          name="tanggal_pengajuan"
                          type="date"
                          value={formData.tanggal_pengaduan}
                          onChange={handleInputChange}
                          className={cn(
                            "transition-all duration-200",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            touchedFields.has("tanggal_pengajuan") &&
                              !formData.tanggal_pengaduan &&
                              "border-destructive",
                            formData.tanggal_pengaduan && "border-green-500",
                          )}
                          required
                        />
                        {formData.tanggal_pengaduan && (
                          <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                        )}
                      </div>
                      {touchedFields.has("tanggal_pengajuan") &&
                        !formData.tanggal_pengaduan && (
                          <p className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            Submission date is required
                          </p>
                        )}
                      <p className="text-xs text-muted-foreground">
                        Date when you submit this complaint
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Section */}
                {userRole === "admin" && (
                  <div className="space-y-4">
                    <div className="mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h4 className="text-lg font-semibold text-foreground">
                        Admin Actions
                      </h4>
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Shield className="h-3 w-3" />
                        Admin Only
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
                            "resize-none transition-all duration-200",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            formData.tindak_lanjut_pengaduan &&
                              "border-green-500",
                          )}
                        />
                        {formData.tindak_lanjut_pengaduan && (
                          <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Follow-up actions or resolution details
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formData.tindak_lanjut_pengaduan?.length || 0}{" "}
                          characters
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Enhanced Form Actions */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-4 border-t border-border/50 pt-6 sm:flex-row sm:justify-end"
            >
              <div className="flex gap-3 sm:order-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={loading}
                      className="transition-all duration-200 hover:bg-muted/50"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel and discard changes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={loading || !formValidation.isValid}
                      className={cn(
                        "transition-all duration-200",
                        "hover:shadow-lg hover:shadow-primary/20",
                        loading && "cursor-not-allowed",
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isEditing ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit Complaint
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {loading
                        ? "Processing your request..."
                        : !formValidation.isValid
                          ? "Please fill all required fields"
                          : isEditing
                            ? "Save your changes"
                            : "Submit your complaint"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Form Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground sm:order-1">
                {success && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Form submitted successfully!</span>
                  </div>
                )}
                {!formValidation.isValid && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      {formValidation.totalFields - formValidation.filledFields}{" "}
                      fields remaining
                    </span>
                  </div>
                )}
                {autoSaveStatus === "saving" && (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Auto-saving...</span>
                  </div>
                )}
                {autoSaveStatus === "saved" && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Auto-saved</span>
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
