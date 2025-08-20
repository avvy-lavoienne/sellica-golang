"use client";

import type React from "react";
import { useState, useCallback, useMemo, useRef, type FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
import type { Dokumentasi } from "@/app/(protected)/aktivitas-user/dokumentasi/page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Upload,
  X,
  Calendar,
  FileText,
  Clock,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Target,
  Camera,
  Download,
  RotateCw,
} from "lucide-react";
import Image from "next/image";

// Enhanced interface with enterprise-grade features
interface InputDokumentasiProps {
  /** Callback function when documentation is added */
  onAddDokumentasi: (dokumentasi: Dokumentasi) => void;
  /** Custom className */
  className?: string;
  /** Animation delay */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Enable drag and drop */
  enableDragDrop?: boolean;
  /** Maximum file size in MB */
  maxFileSize?: number;
}

export default function InputDokumentasi({
  onAddDokumentasi,
  className,
  delay = 0.5,
  disableAnimations = false,
  loading: externalLoading = false,
  error = false,
  enableDragDrop = true,
  maxFileSize = 5,
}: InputDokumentasiProps) {
  // Initialize with current datetime in WIB
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`,
    };
  };

  // Enhanced state management for enterprise UX
  const initialDateTime = getCurrentDateTimeLocal();
  const [tanggalDate, setTanggalDate] = useState(initialDateTime.date);
  const [tanggalTime, setTanggalTime] = useState(initialDateTime.time);
  const [foto, setFoto] = useState<File | null>(null);
  const [judul, setJudul] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  // Refs for enhanced functionality
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-700 dark:text-green-300",
        accent: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-50 dark:bg-green-900/20",
        borderClass: "border-green-200 dark:border-green-800",
        glowClass: "shadow-green-500/20",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200 dark:border-blue-800",
        glowClass: "shadow-blue-500/20",
      },
    }),
    [],
  );

  // Enhanced validation logic
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!judul.trim()) {
      errors.judul = "Judul wajib diisi";
    } else if (judul.length < 3) {
      errors.judul = "Judul minimal 3 karakter";
    } else if (judul.length > 100) {
      errors.judul = "Judul maksimal 100 karakter";
    }

    if (!keterangan.trim()) {
      errors.keterangan = "Keterangan wajib diisi";
    } else if (keterangan.length < 10) {
      errors.keterangan = "Keterangan minimal 10 karakter";
    } else if (keterangan.length > 500) {
      errors.keterangan = "Keterangan maksimal 500 karakter";
    }

    if (!tanggalDate) {
      errors.tanggal = "Tanggal wajib diisi";
    }

    if (!tanggalTime) {
      errors.waktu = "Waktu wajib diisi";
    }

    if (foto && foto.size > maxFileSize * 1024 * 1024) {
      errors.foto = `Ukuran file maksimal ${maxFileSize}MB`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [judul, keterangan, tanggalDate, tanggalTime, foto, maxFileSize]);

  // Real-time validation
  const validateField = useCallback(
    (field: string, value: string) => {
      if (!formTouched) return;

      const errors = { ...validationErrors };

      switch (field) {
        case "judul":
          if (!value.trim()) {
            errors.judul = "Judul wajib diisi";
          } else if (value.length < 3) {
            errors.judul = "Judul minimal 3 karakter";
          } else if (value.length > 100) {
            errors.judul = "Judul maksimal 100 karakter";
          } else {
            delete errors.judul;
          }
          break;
        case "keterangan":
          if (!value.trim()) {
            errors.keterangan = "Keterangan wajib diisi";
          } else if (value.length < 10) {
            errors.keterangan = "Keterangan minimal 10 karakter";
          } else if (value.length > 500) {
            errors.keterangan = "Keterangan maksimal 500 karakter";
          } else {
            delete errors.keterangan;
          }
          break;
      }

      setValidationErrors(errors);
    },
    [validationErrors, formTouched],
  );

  const compressImage = useCallback(async (file: File) => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.7,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      throw error;
    }
  }, []);

  // Enhanced file validation
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith("image/")) {
        return "Silakan unggah file gambar (JPG, PNG, GIF, WebP)";
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        return `Ukuran file maksimal ${maxFileSize}MB`;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        return "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP";
      }

      return null;
    },
    [maxFileSize],
  );

  // Enhanced file handling with validation
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFormTouched(true);
      const validationError = validateFile(file);

      if (validationError) {
        toast.error(validationError);
        setValidationErrors((prev) => ({ ...prev, foto: validationError }));
        return;
      }

      try {
        setFoto(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Clear any previous file validation errors
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.foto;
          return newErrors;
        });

        toast.success("File berhasil dipilih");
      } catch (error) {
        console.error("Error handling file:", error);
        toast.error("Error menangani file");
      }
    },
    [validateFile],
  );

  // Enhanced drag and drop functionality
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (enableDragDrop) {
        setIsDragOver(true);
      }
    },
    [enableDragDrop],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!enableDragDrop) return;

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (!file) return;

      setFormTouched(true);
      const validationError = validateFile(file);

      if (validationError) {
        toast.error(validationError);
        setValidationErrors((prev) => ({ ...prev, foto: validationError }));
        return;
      }

      try {
        setFoto(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Clear any previous file validation errors
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.foto;
          return newErrors;
        });

        toast.success("File berhasil diunggah");
      } catch (error) {
        console.error("Error handling dropped file:", error);
        toast.error("Error menangani file");
      }
    },
    [enableDragDrop, validateFile],
  );

  const clearImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFoto(null);
    setPreviewUrl(null);

    // Clear file validation errors
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.foto;
      return newErrors;
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  const simulateUploadProgress = useCallback(() => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Enhanced form submission with validation
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setFormTouched(true);

      // Validate form before submission
      if (!validateForm()) {
        toast.error("Mohon perbaiki kesalahan pada form");
        return;
      }

      setLoading(true);

      try {
        // Combine date and time with explicit WIB timezone (+07:00)
        const tanggal = `${tanggalDate}T${tanggalTime}+07:00`;

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error("Pengguna tidak ditemukan");

        let fotoUrl = null;
        if (foto) {
          const clearSimulation = simulateUploadProgress();
          const compressedImage = await compressImage(foto);
          const timestamp = Date.now();
          const fileName = `${timestamp}-${compressedImage.name}`;
          const { error: uploadError } = await supabase.storage
            .from("dokumentasi-foto")
            .upload(fileName, compressedImage);

          if (uploadError) throw uploadError;
          fotoUrl = fileName;

          setUploadProgress(100);
          setTimeout(() => {
            clearSimulation();
            setIsUploading(false);
          }, 500);
        }

        // Insert into database
        const { data, error } = await supabase
          .from("dokumentasi")
          .insert([
            {
              tanggal,
              foto: fotoUrl,
              judul,
              keterangan,
              created_by: user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        toast.success("Dokumentasi berhasil ditambahkan");
        onAddDokumentasi(data);

        // Reset form
        const newDateTime = getCurrentDateTimeLocal();
        setTanggalDate(newDateTime.date);
        setTanggalTime(newDateTime.time);
        setFoto(null);
        setJudul("");
        setKeterangan("");
        setPreviewUrl(null);
        setValidationErrors({});
        setFormTouched(false);
      } catch (error: any) {
        console.error("Error:", error);
        toast.error(error.message || "Error menambahkan dokumentasi");
      } finally {
        setLoading(false);
        setIsUploading(false);
      }
    },
    [
      validateForm,
      tanggalDate,
      tanggalTime,
      foto,
      judul,
      keterangan,
      onAddDokumentasi,
      simulateUploadProgress,
      compressImage,
    ],
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
        className={cn("space-y-6", className)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Enhanced Header Card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 p-6 shadow-lg backdrop-blur-sm"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div
                className={cn(
                  "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl",
                  colorSchemes.blue.bgClass,
                  "opacity-20",
                )}
              />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200",
                  colorSchemes.blue.bgClass,
                  colorSchemes.blue.borderClass,
                  "group-hover:scale-105 group-hover:shadow-md",
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className={cn("h-7 w-7", colorSchemes.blue.accent)} />
              </motion.div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground laptop:text-2xl">
                  Tambah Dokumentasi Baru
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" />
                    Form Input
                  </Badge>
                  {formTouched &&
                    Object.keys(validationErrors).length === 0 && (
                      <Badge
                        variant="outline"
                        className="gap-1 text-xs text-green-600"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Valid
                      </Badge>
                    )}
                  {Object.keys(validationErrors).length > 0 && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      {Object.keys(validationErrors).length} Error
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Form Card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-50">
              <div
                className={cn(
                  "absolute left-1/4 top-1/4 h-32 w-32 rounded-full blur-3xl",
                  colorSchemes.green.bgClass,
                  "opacity-20",
                )}
              />
              <div
                className={cn(
                  "absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full blur-2xl",
                  colorSchemes.blue.bgClass,
                  "opacity-15",
                )}
              />
            </div>

            <div className="relative z-10 space-y-6 p-6">
              {/* Enhanced Date & Time and Title Fields */}
              <div className="grid gap-6 md:grid-cols-2 laptop:gap-8">
                {/* Enhanced Date & Time Field */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="tanggal"
                      className="text-sm font-semibold text-foreground"
                    >
                      Tanggal & Waktu
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      WIB
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="group relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="tanggal-date"
                        type="date"
                        required
                        value={tanggalDate}
                        onChange={(e) => {
                          setTanggalDate(e.target.value);
                          setFormTouched(true);
                        }}
                        className={cn(
                          "pl-10 transition-all duration-200",
                          "border-border/50 bg-background/50 backdrop-blur-sm",
                          "focus:border-primary/50 focus:bg-background focus:shadow-lg focus:shadow-primary/10",
                          "hover:border-primary/30 hover:bg-background/80",
                          validationErrors.tanggal &&
                            "border-destructive/50 focus:border-destructive/50",
                        )}
                        style={{ colorScheme: "normal" }}
                      />
                    </div>

                    <div className="group relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        id="tanggal-time"
                        type="time"
                        step="1"
                        required
                        value={tanggalTime}
                        onChange={(e) => {
                          setTanggalTime(e.target.value);
                          setFormTouched(true);
                        }}
                        className={cn(
                          "pl-10 transition-all duration-200",
                          "border-border/50 bg-background/50 backdrop-blur-sm",
                          "focus:border-primary/50 focus:bg-background focus:shadow-lg focus:shadow-primary/10",
                          "hover:border-primary/30 hover:bg-background/80",
                          validationErrors.waktu &&
                            "border-destructive/50 focus:border-destructive/50",
                        )}
                        style={{ colorScheme: "normal" }}
                      />
                    </div>
                  </div>

                  {(validationErrors.tanggal || validationErrors.waktu) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {validationErrors.tanggal || validationErrors.waktu}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Enhanced Title Field */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="judul"
                      className="text-sm font-semibold text-foreground"
                    >
                      Judul Dokumentasi
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {judul.length}/100
                    </span>
                  </div>

                  <div className="group relative">
                    <Input
                      id="judul"
                      type="text"
                      required
                      value={judul}
                      onChange={(e) => {
                        setJudul(e.target.value);
                        validateField("judul", e.target.value);
                        setFormTouched(true);
                      }}
                      placeholder="Masukkan judul dokumentasi"
                      className={cn(
                        "transition-all duration-200",
                        "border-border/50 bg-background/50 backdrop-blur-sm",
                        "focus:border-primary/50 focus:bg-background focus:shadow-lg focus:shadow-primary/10",
                        "hover:border-primary/30 hover:bg-background/80",
                        validationErrors.judul &&
                          "border-destructive/50 focus:border-destructive/50",
                      )}
                    />
                  </div>

                  {validationErrors.judul && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationErrors.judul}</span>
                    </motion.div>
                  )}
                </motion.div>
              </div>

              {/* Enhanced Description Field */}
              <motion.div variants={itemVariants} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="keterangan"
                    className="text-sm font-semibold text-foreground"
                  >
                    Keterangan Dokumentasi
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {keterangan.length}/500
                  </span>
                </div>

                <div className="group relative">
                  <Textarea
                    id="keterangan"
                    required
                    value={keterangan}
                    onChange={(e) => {
                      setKeterangan(e.target.value);
                      validateField("keterangan", e.target.value);
                      setFormTouched(true);
                    }}
                    rows={4}
                    placeholder="Masukkan keterangan detail dokumentasi..."
                    className={cn(
                      "min-h-[120px] resize-none transition-all duration-200",
                      "border-border/50 bg-background/50 backdrop-blur-sm",
                      "focus:border-primary/50 focus:bg-background focus:shadow-lg focus:shadow-primary/10",
                      "hover:border-primary/30 hover:bg-background/80",
                      validationErrors.keterangan &&
                        "border-destructive/50 focus:border-destructive/50",
                    )}
                  />
                </div>

                {validationErrors.keterangan && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{validationErrors.keterangan}</span>
                  </motion.div>
                )}
              </motion.div>

              {/* Enhanced File Upload Section */}
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="foto"
                    className="text-sm font-semibold text-foreground"
                  >
                    Foto Dokumentasi
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    <ImageIcon className="mr-1 h-3 w-3" />
                    Opsional
                  </Badge>
                </div>

                {/* Enhanced Drag & Drop Zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300",
                    "bg-background/30 p-6 backdrop-blur-sm",
                    isDragOver
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/50 hover:border-primary/30 hover:bg-background/50",
                    validationErrors.foto && "border-destructive/50",
                  )}
                >
                  {/* Background decoration for drag zone */}
                  <div className="absolute inset-0 opacity-30">
                    <div
                      className={cn(
                        "absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl",
                        colorSchemes.blue.bgClass,
                        "opacity-40",
                      )}
                    />
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <motion.div
                      className={cn(
                        "flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-200",
                        colorSchemes.blue.bgClass,
                        colorSchemes.blue.borderClass,
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Camera
                        className={cn("h-8 w-8", colorSchemes.blue.accent)}
                      />
                    </motion.div>

                    <div className="space-y-2 text-center">
                      <p className="text-sm font-medium text-foreground">
                        {enableDragDrop
                          ? "Drag & drop foto atau klik untuk memilih"
                          : "Klik untuk memilih foto"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Format: JPG, PNG, GIF, WebP • Maksimal {maxFileSize}MB
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {foto ? "Ganti Foto" : "Pilih Foto"}
                      </Button>

                      {foto && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={clearImage}
                          className="transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Input
                      ref={fileInputRef}
                      id="foto"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {foto && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="max-w-[200px] truncate">
                          {foto.name}
                        </span>
                        <span className="text-xs">
                          ({(foto.size / 1024 / 1024).toFixed(2)}MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {validationErrors.foto && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-destructive"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{validationErrors.foto}</span>
                  </motion.div>
                )}

                {/* Enhanced Image Preview */}
                {previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <Card className="overflow-hidden border border-border/50 bg-background/50 backdrop-blur-sm">
                      <div className="relative aspect-video w-full">
                        <Image
                          src={previewUrl || "/placeholder.svg"}
                          alt="Preview dokumentasi"
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />

                        {/* Enhanced overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />

                        <motion.div
                          className="absolute right-2 top-2"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-destructive/90 backdrop-blur-sm transition-all duration-200 hover:bg-destructive"
                            onClick={clearImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Enhanced Upload Progress */}
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Mengunggah...
                      </span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Enhanced Info Message */}
              {!foto && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-800">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Foto Opsional
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Foto tidak wajib, namun sangat disarankan untuk
                      dokumentasi yang lebih baik.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Enhanced Submit Section */}
          <motion.div variants={itemVariants} className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={loading || externalLoading}
              className={cn(
                "px-8 py-3 transition-all duration-200",
                "bg-primary hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
              size="lg"
            >
              {loading || externalLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Simpan Dokumentasi
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </TooltipProvider>
  );
}