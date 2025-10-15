"use client";

import React, { useState, useCallback, useMemo, useRef, type FormEvent } from "react";
import { Button, TextInput, Textarea, Card, Label, Badge } from "flowbite-react";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
import type { Dokumentasi } from "@/app/(protected)/aktivitas-user/dokumentasi/page";
import Image from "next/image";
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  ImageIcon,
  Camera,
  Upload,
  X,
  Info,
  Loader2
} from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Enhanced interface with enterprise-grade features
interface InputDokumentasiProps {
  /** Callback function when documentation is added */
  onAddDokumentasi: (dokumentasi: Dokumentasi) => void;
  /** Custom className */
  className?: string;
  /** Enable drag and drop */
  enableDragDrop?: boolean;
  /** Maximum file size in MB */
  maxFileSize?: number;
}

export default function InputDokumentasi({
  onAddDokumentasi,
  className,
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

  // Enhanced state management
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
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState(false);

  // Refs for enhanced functionality
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
      return await imageCompression(file, options);
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

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
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

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.foto;
      return newErrors;
    });

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

      if (!validateForm()) {
        toast.error("Mohon perbaiki kesalahan pada form");
        return;
      }

      setLoading(true);

      try {
        const tanggal = `${tanggalDate}T${tanggalTime}+07:00`;

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Pengguna tidak ditemukan");
        }

        let fotoUrl = null;
        if (foto) {
          const clearSimulation = simulateUploadProgress();
          const compressedImage = await compressImage(foto);
          const timestamp = Date.now();
          const fileName = `${timestamp}-${compressedImage.name}`;
          const { error: uploadError } = await supabase.storage
            .from("dokumentasi-foto")
            .upload(fileName, compressedImage);

          if (uploadError) {
            throw uploadError;
          }

          fotoUrl = fileName;

          setUploadProgress(100);
          setTimeout(() => {
            clearSimulation();
            setIsUploading(false);
          }, 500);
        }

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

        if (error) {
          throw error;
        }

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
    [validateForm, tanggalDate, tanggalTime, foto, judul, keterangan, onAddDokumentasi, simulateUploadProgress, compressImage],
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Simple Header */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tambah Dokumentasi Baru
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Form Input</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date & Time and Title Fields */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Date & Time Field */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tanggal" className="text-sm font-medium">
                  Tanggal & Waktu
                </Label>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  WIB
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  id="tanggal-date"
                  type="date"
                  required
                  value={tanggalDate}
                  onChange={(e) => {
                    setTanggalDate(e.target.value);
                    setFormTouched(true);
                  }}
                  color={validationErrors.tanggal ? "failure" : "gray"}
                />
                <TextInput
                  id="tanggal-time"
                  type="time"
                  step="1"
                  required
                  value={tanggalTime}
                  onChange={(e) => {
                    setTanggalTime(e.target.value);
                    setFormTouched(true);
                  }}
                  color={validationErrors.waktu ? "failure" : "gray"}
                />
              </div>

              {(validationErrors.tanggal || validationErrors.waktu) && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationErrors.tanggal || validationErrors.waktu}
                </p>
              )}
            </div>

            {/* Title Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="judul" className="text-sm font-medium">
                  Judul Dokumentasi
                </Label>
                <span className="text-xs text-gray-500">{judul.length}/100</span>
              </div>

              <TextInput
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
                color={validationErrors.judul ? "failure" : "gray"}
              />

              {validationErrors.judul && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {validationErrors.judul}
                </p>
              )}
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="keterangan" className="text-sm font-medium">
                Keterangan Dokumentasi
              </Label>
              <span className="text-xs text-gray-500">{keterangan.length}/500</span>
            </div>

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
              color={validationErrors.keterangan ? "failure" : "gray"}
            />

            {validationErrors.keterangan && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.keterangan}
              </p>
            )}
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="foto" className="text-sm font-medium">
                Foto Dokumentasi
              </Label>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <ImageIcon className="h-3 w-3" />
                Opsional
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                isDragOver
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700",
                validationErrors.foto && "border-red-500",
              )}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {enableDragDrop
                      ? "Drag & drop foto atau klik untuk memilih"
                      : "Klik untuk memilih foto"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Format: JPG, PNG, GIF, WebP • Maksimal {maxFileSize}MB
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    outline
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {foto ? "Ganti Foto" : "Pilih Foto"}
                  </Button>

                  {foto && (
                    <Button
                      type="button"
                      outline
                      color="failure"
                      size="sm"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  id="foto"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {foto && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="max-w-[200px] truncate">{foto.name}</span>
                    <span className="text-xs">
                      ({(foto.size / 1024 / 1024).toFixed(2)}MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {validationErrors.foto && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {validationErrors.foto}
              </p>
            )}

            {/* Image Preview */}
            {previewUrl && (
              <Card className="overflow-hidden">
                <div className="relative aspect-video w-full">
                  <Image
                    src={previewUrl}
                    alt="Preview dokumentasi"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition-all hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Mengunggah...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Message */}
          {!foto && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Foto Opsional
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Foto tidak wajib, namun sangat disarankan untuk dokumentasi yang lebih baik.
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} size="lg" className="min-w-[200px]">
              {loading ? (
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
          </div>
        </form>
      </Card>
    </div>
  );
}
