"use client";

import type React from "react";
import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Home,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Info,
  Settings,
  Shield,
  Activity,
  BarChart3,
  PieChart,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import type {
  SilpanaData,
  SilpanaFormData,
  EnhancedSilpanaData,
  PriorityLevel,
  TicketStatus,
} from "@/types/silpana/silpana";
import SilpanaHeader from "@/components/silpana/SilpanaHeader";
import SilpanaActions from "@/components/silpana/SilpanaActions";
import SilpanaForm from "@/components/silpana/SilpanaForm";
import SilpanaTable from "@/components/silpana/SilpanaTable";
import TicketLookup from "@/components/silpana/TicketLookup";
import TicketSuccessFeedback from "@/components/silpana/TicketSuccessFeedback";
import EmptyState from "@/components/silpana/EmptyState";
import LoadingState from "@/components/silpana/LoadingState";
import LastUpdatedBadge from "@/components/silpana/LastUpdatedBadge";
import EnhancedNavigation from "@/components/silpana/EnhancedNavigation";
import { SilpanaMode } from "@/types/silpana/silpana";

export default function SilpanaPage() {
  // Enhanced navigation state with new enum system
  const [activeMode, setActiveMode] = useState<SilpanaMode>(SilpanaMode.LOOKUP); // Default to lookup for user-friendly access
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SilpanaData | null>(null);
  const [foundTicket, setFoundTicket] = useState<EnhancedSilpanaData | null>(null);
  const [formData, setFormData] = useState<SilpanaFormData>({
    nik_pengaduan: "",
    nama_pengaduan: "",
    kategori_pengaduan: "",
    sub_kategori_pengaduan: "",
    alasan_pengaduan: "",
    deskripsi_pengaduan: "",
    nomor_telepon: "",
    tindak_lanjut_pengaduan: "",
    tanggal_pengaduan: new Date().toISOString().split("T")[0],
    is_anonymous: false,
    priority_level: 'medium' as PriorityLevel,
  });
  const [rekapData, setRekapData] = useState<SilpanaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<"created_at" | "tanggal_pengaduan">(
    "tanggal_pengaduan",
  );
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pageProgress, setPageProgress] = useState(0);
  
  // Enhanced loading and error states
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  
  // Success feedback state for ticket generation
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [generatedTicketCode, setGeneratedTicketCode] = useState<string | null>(null);

  // Refs for enhanced functionality
  const containerRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<any>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

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

  // Enhanced page statistics with new navigation system
  const pageStats = useMemo(() => {
    const hasFilters = startDate || endDate || searchQuery.trim().length > 0;
    const hasData = rekapData.length > 0;
    const isActive = activeMode !== SilpanaMode.LOOKUP;
    return {
      hasFilters,
      hasData,
      isActive,
      totalItems: totalCount,
      filteredItems: rekapData.length,
      currentMode: activeMode,
    };
  }, [
    startDate,
    endDate,
    searchQuery,
    rekapData.length,
    totalCount,
    activeMode,
  ]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);
  const debouncedFilterBy = useDebounce(filterBy, 500);

  const validatePhoneNumber = (phone: string) => {
    return /^(\+62|62|0)[0-9]{9,12}$/.test(phone);
  };

  const fetchRekapData = useCallback(
    async (
      page = 1,
      searchQuery = "",
      startDate: Date | null = null,
      endDate: Date | null = null,
      filterField: "created_at" | "tanggal_pengaduan" = "tanggal_pengaduan",
    ) => {
      try {
        setIsTableLoading(true);
        const rowsPerPage = 5;
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage - 1;

        let query = supabase
          .from("silpana")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(start, end);

        // Public access - no user filtering for now

        if (searchQuery) {
          query = query.or(
            `nik_pengaduan.ilike.%${searchQuery}%,nama_pengaduan.ilike.%${searchQuery}%,nama_pelapor.ilike.%${searchQuery}%,alasan_pengaduan.ilike.%${searchQuery}%,deskripsi_pengaduan.ilike.%${searchQuery}%`,
          );
        }

        if (startDate && endDate) {
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);

          if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            toast.error(
              "Tanggal tidak valid. Silakan pilih tanggal yang benar.",
            );
            return { totalCount: 0 };
          }

          if (endDateObj < startDateObj) {
            toast.error("Tanggal akhir tidak boleh sebelum tanggal mulai.");
            return { totalCount: 0 };
          }

          if (filterField === "created_at") {
            startDateObj.setUTCHours(0, 0, 0, 0);
            endDateObj.setUTCHours(23, 59, 59, 999);
            const startISO = startDateObj.toISOString();
            const endISO = endDateObj.toISOString();
            query = query.gte("created_at", startISO).lte("created_at", endISO);
          } else if (filterField === "tanggal_pengaduan") {
            const startFormatted = startDateObj.toISOString().split("T")[0];
            const endFormatted = endDateObj.toISOString().split("T")[0];
            query = query
              .gte("tanggal_pengaduan", startFormatted)
              .lte("tanggal_pengaduan", endFormatted);
          }
        }

        const { data: silpanaData, error, count } = await query;

        if (error) {
          throw new Error(`Gagal mengambil data SILPANA: ${error.message}`);
        }

        // Transform database column names to match TypeScript interface
        const transformedData = (silpanaData || []).map((item: any) => ({
          id: item.id,
          // Database has both nama_pengaduan and nama_pelapor - use appropriate mapping
          nik_pengaduan: item.nik_pengaduan,
          nama_pengaduan: item.nama_pengaduan || item.nama_pelapor,
          kategori_pengaduan: item.kategori_pengaduan,
          sub_kategori_pengaduan: item.sub_kategori_pengaduan || 'Umum',
          alasan_pengaduan: item.alasan_pengaduan,
          deskripsi_pengaduan: item.deskripsi_pengaduan || item.alasan_pengaduan,
          nomor_telepon: item.nomor_telepon,
          tindak_lanjut_pengaduan: item.tindak_lanjut_pengaduan || '',
          tanggal_pengaduan: item.tanggal_pengaduan,
          is_anonymous: item.is_anonymous || false,
          // Ticketing system fields
          ticket_status: item.ticket_status || 'submitted',
          priority_level: item.priority_level || 'medium',
          ticket_code: item.ticket_code,
          assigned_to: item.assigned_to,
          resolution_notes: item.resolution_notes,
          // Timestamps
          created_at: item.created_at,
          updated_at: item.updated_at,
          // Optional fields
          alamat: item.alamat,
          email: item.email,
          estimated_resolution: item.estimated_resolution,
          actual_resolution: item.actual_resolution,
          created_by_ip: item.created_by_ip,
          creator_name: item.creator_name,
          user_id: item.user_id,
        }));

        setRekapData(transformedData);
        return { totalCount: count || 0 };
      } catch (error: any) {
        toast.error(
          error.message || "Gagal mengambil data SILPANA. Silakan coba lagi.",
        );
        return { totalCount: 0 };
      } finally {
        setIsTableLoading(false);
      }
    },
    [], // No dependencies needed for public access
  );

  const memoizedFetchRekapData = useMemo(
    () => fetchRekapData,
    [fetchRekapData],
  );

  useEffect(() => {
    if (activeMode === SilpanaMode.REKAP) {
      memoizedFetchRekapData(
        currentPage,
        debouncedSearchQuery,
        debouncedStartDate,
        debouncedEndDate,
        debouncedFilterBy,
      ).then(({ totalCount }) => setTotalCount(totalCount));
    }
  }, [
    currentPage,
    activeMode,
    debouncedSearchQuery,
    debouncedStartDate,
    debouncedEndDate,
    debouncedFilterBy,
    memoizedFetchRekapData,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous states
    setSubmissionError(null);
    setValidationErrors({});
    setIsSubmitting(true);
    setLoading(true);
    setSubmissionProgress(0);

    try {
      // Step 1: Client-side validation (20% progress)
      setSubmissionProgress(20);
      const errors: Record<string, string> = {};

      if (!formData.nik_pengaduan.trim()) {
        errors.nik_pengaduan = "NIK wajib diisi";
      } else if (!/^\d{16}$/.test(formData.nik_pengaduan.replace(/\s+/g, ''))) {
        errors.nik_pengaduan = "NIK harus 16 digit angka";
      }

      if (!formData.nama_pengaduan.trim()) {
        errors.nama_pengaduan = "Nama wajib diisi";
      } else if (formData.nama_pengaduan.trim().length < 2) {
        errors.nama_pengaduan = "Nama minimal 2 karakter";
      }

      if (!formData.kategori_pengaduan) {
        errors.kategori_pengaduan = "Kategori pengaduan wajib dipilih";
      }

      if (!formData.sub_kategori_pengaduan) {
        errors.sub_kategori_pengaduan = "Sub kategori pengaduan wajib dipilih";
      }

      if (!formData.alasan_pengaduan.trim()) {
        errors.alasan_pengaduan = "Alasan pengaduan wajib diisi";
      }

      if (!formData.deskripsi_pengaduan.trim()) {
        errors.deskripsi_pengaduan = "Deskripsi pengaduan wajib diisi";
      } else if (formData.deskripsi_pengaduan.trim().length < 10) {
        errors.deskripsi_pengaduan = "Deskripsi minimal 10 karakter";
      }

      // Enhanced phone number validation
      if (formData.nomor_telepon && !/^(\+62|62|0)\d{8,13}$/.test(formData.nomor_telepon.replace(/\s+/g, ''))) {
        errors.nomor_telepon = "Format nomor telepon tidak valid (contoh: 081234567890)";
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Harap perbaiki kesalahan pada form");
        setIsSubmitting(false);
        setLoading(false);
        setSubmissionProgress(0);
        return;
      }

      // Step 2: Prepare data (40% progress)
      setSubmissionProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      const submissionData = {
        // Map to actual database column names from the schema
        nik_pengaduan: formData.nik_pengaduan.replace(/\s+/g, ''),
        nama_pengaduan: formData.nama_pengaduan.trim(),
        nama_pelapor: formData.nama_pengaduan.trim(), // This field also exists in DB
        kategori_pengaduan: formData.kategori_pengaduan,
        sub_kategori_pengaduan: formData.sub_kategori_pengaduan || 'Umum',
        alasan_pengaduan: formData.alasan_pengaduan.trim(),
        deskripsi_pengaduan: formData.deskripsi_pengaduan?.trim() || formData.alasan_pengaduan.trim(),
        nomor_telepon: formData.nomor_telepon.replace(/\s+/g, ''),
        tindak_lanjut_pengaduan: formData.tindak_lanjut_pengaduan || '',
        tanggal_pengaduan: formData.tanggal_pengaduan,
        is_anonymous: formData.is_anonymous || false,
        priority_level: formData.priority_level || 'medium',
        ticket_status: 'submitted',
        alamat: '', // Optional field in DB
        email: '', // Optional field in DB
        created_by_ip: null, // Optional field in DB
      };

      // Step 3: Submit to database (80% progress)
      setSubmissionProgress(80);
      const { data, error } = await supabase
        .from('silpana')
        .insert([submissionData])
        .select('*')
        .single();

      if (error) {
        console.error('Submission error:', error);
        let errorMessage = "Gagal mengirim pengaduan";
        
        // Handle specific database errors
        if (error.code === '23505') {
          errorMessage = "Data pengaduan sudah ada. Silakan periksa kembali NIK Anda.";
        } else if (error.code === '23514') {
          errorMessage = "Data tidak valid. Harap periksa kembali form Anda.";
        } else if (error.message.includes('duplicate')) {
          errorMessage = "Pengaduan dengan data serupa sudah pernah dikirim";
        } else if (error.message.includes('network')) {
          errorMessage = "Masalah koneksi jaringan. Silakan coba lagi.";
        }
        
        setSubmissionError(errorMessage);
        toast.error(errorMessage);
        setIsSubmitting(false);
        setLoading(false);
        setSubmissionProgress(0);
        return;
      }

      // Step 4: Success processing (100% progress)
      setSubmissionProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300)); // Show completion

      const ticketCode = data.ticket_code;
      
      if (!ticketCode) {
        throw new Error("Ticket code not generated");
      }

      // Show success feedback modal
      setGeneratedTicketCode(ticketCode);
      setShowSuccessFeedback(true);

      // Show toast notification
      toast.success(
        <div className="space-y-2">
          <div className="font-semibold">Pengaduan berhasil dikirim!</div>
          <div className="text-sm">
            <div>Kode Tiket: <span className="font-mono font-bold text-green-600">{ticketCode}</span></div>
            <div className="mt-1">Simpan kode ini untuk melacak status pengaduan Anda</div>
          </div>
        </div>,
        {
          autoClose: 8000,
          hideProgressBar: false,
        }
      );

      // Reset form and clear errors
      setFormData({
        nik_pengaduan: "",
        nama_pengaduan: "",
        kategori_pengaduan: "",
        sub_kategori_pengaduan: "",
        alasan_pengaduan: "",
        deskripsi_pengaduan: "",
        nomor_telepon: "",
        tindak_lanjut_pengaduan: "",
        tanggal_pengaduan: new Date().toISOString().split("T")[0],
        is_anonymous: false,
        priority_level: 'medium' as PriorityLevel,
      });
      
      // Clear any remaining errors
      setValidationErrors({});
      setSubmissionError(null);

    } catch (error) {
      console.error('Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak terduga";
      setSubmissionError(errorMessage);
      toast.error("Terjadi kesalahan yang tidak terduga. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
      setSubmissionProgress(0);
    }
  };

  const handleEdit = useCallback((data: SilpanaData) => {
    // Disable editing for public access
    toast.info("Editing is not available for public access.");
    return;
    setFormData({
      nik_pengaduan: data.nik_pengaduan || "",
      nama_pengaduan: data.nama_pengaduan || "",
      kategori_pengaduan: data.kategori_pengaduan || "",
      sub_kategori_pengaduan: data.sub_kategori_pengaduan || "",
      alasan_pengaduan: data.alasan_pengaduan || "",
      deskripsi_pengaduan: data.deskripsi_pengaduan || "",
      nomor_telepon: data.nomor_telepon || "",
      tindak_lanjut_pengaduan: data.tindak_lanjut_pengaduan || "",
      tanggal_pengaduan:
        data.tanggal_pengaduan || new Date().toISOString().split("T")[0],
      is_anonymous: data.is_anonymous || false,
    });
    setActiveMode(SilpanaMode.FORM);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      // Disable delete for public access
      toast.info("Delete functionality is not available for public access.");
      return;
    },
    [], // No dependencies needed for disabled function
  );

  // Enhanced navigation handlers with new enum system
  const handleModeChange = useCallback((newMode: SilpanaMode) => {
    setActiveMode(newMode);
    // Clear related state when switching modes
    if (newMode !== SilpanaMode.LOOKUP) {
      setFoundTicket(null);
    }
    if (newMode !== SilpanaMode.FORM) {
      setIsEditing(false);
      setEditData(null);
    }
  }, []);

  const handleRekapitulasi = useCallback(() => {
    handleModeChange(SilpanaMode.REKAP);
  }, [handleModeChange]);

  const handleTicketLookup = useCallback(() => {
    handleModeChange(SilpanaMode.LOOKUP);
  }, [handleModeChange]);

  const handleFormMode = useCallback(() => {
    handleModeChange(SilpanaMode.FORM);
  }, [handleModeChange]);

  const handleTicketFound = useCallback((ticket: EnhancedSilpanaData) => {
    setFoundTicket(ticket);
  }, []);

  const handleLookupError = useCallback((error: string) => {
    setFoundTicket(null);
    toast.error(error);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      if (query !== searchQuery) {
        setSearchQuery(query);
        setCurrentPage(1);
      }
    },
    [searchQuery],
  );

  const handleRefresh = useCallback(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setFilterBy("tanggal_pengaduan");
  }, []);

  const handleCancel = useCallback(() => {
    setActiveMode(SilpanaMode.LOOKUP);
    setIsEditing(false);
    setEditData(null);
    setFormData({
      nik_pengaduan: "",
      nama_pengaduan: "",
      kategori_pengaduan: "",
      sub_kategori_pengaduan: "",
      alasan_pengaduan: "",
      deskripsi_pengaduan: "",
      nomor_telepon: "",
      tindak_lanjut_pengaduan: "",
      tanggal_pengaduan: new Date().toISOString().split("T")[0],
      is_anonymous: false,
    });
  }, []);

  // Add the handleAjukan function for form navigation
  const handleAjukan = useCallback(() => {
    handleModeChange(SilpanaMode.FORM);
  }, [handleModeChange]);

  const memoizedTableProps = useMemo(
    () => ({
      rekapData,
      totalCount,
      currentPage,
      onPageChange: handlePageChange,
      onSearch: handleSearch,
      onRefresh: handleRefresh,
      onEdit: handleEdit,
      onDelete: handleDelete,
      userRole: "public", // Set to public for read-only access
      loading: isTableLoading,
    }),
    [
      rekapData,
      totalCount,
      currentPage,
      handlePageChange,
      handleSearch,
      handleRefresh,
      handleEdit,
      handleDelete,
      isTableLoading,
    ],
  );

  // Animation variants for enterprise-grade micro-interactions
  const pageVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.8 : 0,
        ease: "easeOut" as const,
        staggerChildren: 0.2,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.5 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <TooltipProvider>
      <motion.div
        ref={containerRef}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "min-h-screen bg-gradient-to-br from-background via-background to-muted/20",
          "px-4 py-10 sm:px-6 lg:px-8",
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {/* Enhanced Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          className="z-50"
        />

        <div className="mx-auto max-w-7xl space-y-6">
          {/* Enhanced Breadcrumb Navigation */}
          <motion.div
            variants={sectionVariants}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-sm backdrop-blur-sm"
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

            <div className="relative z-10 p-4">
              <nav
                className="flex items-center space-x-2 text-sm"
                aria-label="Breadcrumb"
              >
                <Link
                  href="/"
                  className="flex items-center gap-1 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  SILPANA
                </span>
              </nav>
            </div>
          </motion.div>

          {/* Enhanced Page Header with Statistics */}
          <motion.div
            variants={sectionVariants}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm"
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

            <div className="relative z-10 p-6">
              <div className="flex flex-col gap-6 laptop:flex-row laptop:items-center laptop:justify-between">
                <div className="space-y-4">
                  <SilpanaHeader />

                  {/* Enhanced Statistics */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="gap-2 px-3 py-1">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">
                        {pageStats.totalItems} Total
                      </span>
                    </Badge>

                    {pageStats.hasFilters && (
                      <Badge variant="outline" className="gap-2 px-3 py-1">
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">
                          {pageStats.filteredItems} Filtered
                        </span>
                      </Badge>
                    )}

                    <LastUpdatedBadge />

                    {activeMode === SilpanaMode.FORM && (
                      <Badge variant="default" className="gap-2 px-3 py-1">
                        <Sparkles className="h-4 w-4" />
                        <span>Form Mode</span>
                      </Badge>
                    )}

                    {activeMode === SilpanaMode.REKAP && (
                      <Badge variant="default" className="gap-2 px-3 py-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>Table Mode</span>
                      </Badge>
                    )}

                    {activeMode === SilpanaMode.LOOKUP && (
                      <Badge variant="default" className="gap-2 px-3 py-1">
                        <Search className="h-4 w-4" />
                        <span>Lookup Mode</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Enhanced Quick Actions */}
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={loading || isTableLoading}
                        className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                      >
                        <RefreshCw
                          className={cn(
                            "h-4 w-4",
                            (loading || isTableLoading) && "animate-spin",
                          )}
                        />
                        <span className="ml-2 hidden sm:inline">
                          {loading || isTableLoading ? "Loading..." : "Refresh"}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh all data</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Admin features removed for public access */}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Main Content Container */}
          <motion.div
            variants={sectionVariants}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-40">
              <div
                className={cn(
                  "absolute -bottom-8 -left-8 h-32 w-32 rounded-full blur-3xl",
                  colorSchemes.green.bgClass,
                  "opacity-30",
                )}
              />
            </div>

            <div className="relative z-10 p-6 sm:p-8">
              {/* Enhanced Navigation System */}
              <Suspense fallback={<div>Loading navigation...</div>}>
                <EnhancedNavigation
                  onModeChange={handleModeChange}
                  showKeyboardHints={true}
                  className="mb-8"
                />
              </Suspense>

              {/* Legacy SilpanaActions for filtering - only show when in rekap mode */}
              {activeMode === SilpanaMode.REKAP && (
                <SilpanaActions
                  onAjukan={handleAjukan}
                  onRekapitulasi={handleRekapitulasi}
                  onTicketLookup={handleTicketLookup}
                  activeMode="table"
                  onDateRangeChange={(start, end, filterField) => {
                    setStartDate(start);
                    setEndDate(end);
                    setFilterBy(filterField);
                    setCurrentPage(1);
                  }}
                  onResetFilters={handleRefresh}
                  onSearch={handleSearch}
                  searchQuery={searchQuery}
                  loading={loading || isTableLoading}
                  totalItems={pageStats.totalItems}
                  filteredItems={pageStats.filteredItems}
                  onRefresh={handleRefresh}
                />
              )}

              {/* Enhanced Content Section with mode-based rendering */}
              <div className="mt-8 space-y-6">
                <AnimatePresence mode="wait">
                  {activeMode === SilpanaMode.FORM && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{
                        duration: shouldAnimate ? 0.4 : 0,
                        ease: "easeOut",
                      }}
                      className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-sm backdrop-blur-sm"
                    >
                      {/* Background decoration for form */}
                      <div className="absolute inset-0 opacity-30">
                        <div
                          className={cn(
                            "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl",
                            colorSchemes.blue.bgClass,
                            "opacity-40",
                          )}
                        />
                      </div>

                      <div className="relative z-10">
                        <SilpanaForm
                          formData={formData}
                          setFormData={setFormData}
                          onSubmit={handleSubmit}
                          onCancel={handleCancel}
                          loading={isSubmitting}
                          isEditing={isEditing}
                          editData={editData}
                          userRole="public"
                          errors={validationErrors}
                          showProgress={true}
                          submissionProgress={submissionProgress}
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeMode === SilpanaMode.REKAP && (
                    <motion.div
                      key="table"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{
                        duration: shouldAnimate ? 0.4 : 0,
                        ease: "easeOut",
                      }}
                      className="space-y-4"
                    >
                      {isTableLoading ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-sm backdrop-blur-sm"
                        >
                          <div className="p-8">
                            <LoadingState />
                          </div>
                        </motion.div>
                      ) : rekapData.length > 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: shouldAnimate ? 0.3 : 0,
                            delay: 0.1,
                          }}
                        >
                          <SilpanaTable {...memoizedTableProps} />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: shouldAnimate ? 0.3 : 0 }}
                          className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-sm backdrop-blur-sm"
                        >
                          {/* Background decoration for empty state */}
                          <div className="absolute inset-0 opacity-30">
                            <div
                              className={cn(
                                "absolute -bottom-6 -left-6 h-24 w-24 rounded-full blur-2xl",
                                colorSchemes.green.bgClass,
                                "opacity-40",
                              )}
                            />
                          </div>

                          <div className="relative z-10 p-8">
                            <EmptyState
                              onAddNew={() => {
                                handleModeChange(SilpanaMode.FORM);
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {activeMode === SilpanaMode.LOOKUP && (
                    <motion.div
                      key="lookup"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{
                        duration: shouldAnimate ? 0.4 : 0,
                        ease: "easeOut",
                      }}
                    >
                      <TicketLookup
                        onTicketFound={handleTicketFound}
                        onError={handleLookupError}
                      />
                    </motion.div>
                  )}

                  {activeMode === SilpanaMode.ADMIN && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.98 }}
                      transition={{
                        duration: shouldAnimate ? 0.4 : 0,
                        ease: "easeOut",
                      }}
                      className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 shadow-sm backdrop-blur-sm"
                    >
                      {/* Background decoration for welcome state */}
                      <div className="absolute inset-0 opacity-30">
                        <div
                          className={cn(
                            "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
                            colorSchemes.primary.bgClass,
                            "opacity-40",
                          )}
                        />
                        <div
                          className={cn(
                            "absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full blur-2xl",
                            colorSchemes.blue.bgClass,
                            "opacity-30",
                          )}
                        />
                      </div>

                      <div className="relative z-10 p-8">
                        <EmptyState
                          onAddNew={() => {
                            handleModeChange(SilpanaMode.FORM);
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Success Feedback Modal */}
      <TicketSuccessFeedback
        ticketCode={generatedTicketCode || ""}
        isVisible={showSuccessFeedback}
        onClose={() => {
          setShowSuccessFeedback(false);
          setGeneratedTicketCode(null);
          handleModeChange(SilpanaMode.LOOKUP);
        }}
      />
    </TooltipProvider>
  );
}
