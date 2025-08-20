"use client";

import type React from "react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Clock,
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
  PengaduanBulananData,
  PengaduanBulananFormData,
} from "@/types/aktivitas-user/pengaduan-bulanan";
import PengaduanBulananHeader from "@/components/dashboard/aktivitas-user/pengaduan-bulanan/PengaduanBulananHeader";
import PengaduanBulananActions from "@/components/dashboard/aktivitas-user/pengaduan-bulanan/PengaduanBulananActions";
import PengaduanBulananForm from "@/components/dashboard/aktivitas-user/pengaduan-bulanan/PengaduanBulananForm";
import PengaduanBulananTable from "@/components/dashboard/aktivitas-user/pengaduan-bulanan/PengaduanBulananTable";
import EmptyState from "@/components/dashboard/aktivitas-user/pengaduan-bulanan/EmptyState";
import LoadingState from "@/components/dashboard/aktivitas-user/pengaduan-bulanan/LoadingState";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Profile {
  name: string;
  nik: string;
  role: string;
}

export default function PengaduanBulananPage() {
  const router = useRouter();

  // Enhanced state management for enterprise UX
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [showForm, setShowForm] = useState(false);
  const [showRekap, setShowRekap] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PengaduanBulananData | null>(null);
  const [formData, setFormData] = useState<PengaduanBulananFormData>({
    nik_pengaduan: "",
    nama_pengaduan: "",
    alasan_pengaduan: "",
    deskripsi_pengaduan: "",
    nomor_telepon: "",
    tindak_lanjut_pengaduan: "",
    tanggal_pengaduan: new Date().toISOString().split("T")[0],
  });
  const [rekapData, setRekapData] = useState<PengaduanBulananData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
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

  // Enhanced page statistics
  const pageStats = useMemo(() => {
    const hasFilters = startDate || endDate || searchQuery.trim().length > 0;
    const hasData = rekapData.length > 0;
    const isActive = showForm || showRekap;
    return {
      hasFilters,
      hasData,
      isActive,
      totalItems: totalCount,
      filteredItems: rekapData.length,
      currentMode: showForm ? "form" : showRekap ? "table" : "none",
    };
  }, [
    startDate,
    endDate,
    searchQuery,
    rekapData.length,
    totalCount,
    showForm,
    showRekap,
  ]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);
  const debouncedFilterBy = useDebounce(filterBy, 500);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsFetchingUser(true);
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session) {
          toast.error("Sesi tidak ditemukan. Silakan login kembali.");
          router.push("/");
          return;
        }

        setUser(session.user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, nik, role")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          throw new Error(`Gagal mengambil profil: ${profileError.message}`);
        }

        if (!profileData.nik) {
          toast.error(
            "NIK Anda di profil tidak valid. Harap perbarui profil Anda terlebih dahulu.",
          );
          router.push("/profile");
          return;
        }

        setUserRole(profileData.role || "user");
      } catch (error: any) {
        toast.error(
          error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
        );
        router.push("/");
      } finally {
        setIsFetchingUser(false);
      }
    };

    fetchUserData();
  }, [router]);

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
      if (!user) {
        toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
        router.push("/");
        return { totalCount: 0 };
      }

      try {
        setIsTableLoading(true);
        const rowsPerPage = 5;
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage - 1;

        let query = supabase
          .from("pengaduan_bulanan")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(start, end);

        if (userRole === "user") {
          query = query.eq("user_id", user.id);
        }

        if (searchQuery) {
          query = query.or(
            `nik_pengaduan.ilike.%${searchQuery}%,nama_pengaduan.ilike.%${searchQuery}%,alasan_pengaduan.ilike.%${searchQuery}%`,
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

        const { data: pengaduanData, error, count } = await query;

        if (error) {
          throw new Error(`Gagal mengambil data pengaduan: ${error.message}`);
        }

        setRekapData(pengaduanData || []);
        return { totalCount: count || 0 };
      } catch (error: any) {
        toast.error(
          error.message || "Gagal mengambil data pengaduan. Silakan coba lagi.",
        );
        return { totalCount: 0 };
      } finally {
        setIsTableLoading(false);
      }
    },
    [user, userRole, router],
  );

  const memoizedFetchRekapData = useMemo(
    () => fetchRekapData,
    [fetchRekapData],
  );

  useEffect(() => {
    if (user && showRekap && !showForm) {
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
    showRekap,
    debouncedSearchQuery,
    debouncedStartDate,
    debouncedEndDate,
    debouncedFilterBy,
    memoizedFetchRekapData,
    user,
    showForm,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
      router.push("/");
      return;
    }

    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat mengubah data ini.");
      return;
    }

    setLoading(true);

    try {
      const dataToSave = {
        user_id: user.id,
        nik_pengaduan: formData.nik_pengaduan.trim(),
        nama_pengaduan: formData.nama_pengaduan.trim(),
        alasan_pengaduan: formData.alasan_pengaduan.trim(),
        deskripsi_pengaduan: formData.deskripsi_pengaduan.trim(),
        nomor_telepon: formData.nomor_telepon.trim(),
        tindak_lanjut_pengaduan: formData.tindak_lanjut_pengaduan?.trim() || "",
        tanggal_pengaduan: formData.tanggal_pengaduan,
      };

      if (isEditing && editData) {
        const { error } = await supabase
          .from("pengaduan_bulanan")
          .update(dataToSave)
          .eq("id", editData.id);

        if (error) {
          throw new Error(`Gagal memperbarui data: ${error.message}`);
        }
        toast.success("Pengaduan berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("pengaduan_bulanan")
          .insert(dataToSave);
        if (error) {
          throw new Error(`Gagal menyimpan data: ${error.message}`);
        }
        toast.success("Pengaduan berhasil diajukan!");
      }

      setShowForm(false);
      setIsEditing(false);
      setEditData(null);
      setFormData({
        nik_pengaduan: "",
        nama_pengaduan: "",
        alasan_pengaduan: "",
        deskripsi_pengaduan: "",
        nomor_telepon: "",
        tindak_lanjut_pengaduan: "",
        tanggal_pengaduan: new Date().toISOString().split("T")[0],
      });

      setShowRekap(true);
      setCurrentPage(1);
      setSearchQuery("");
      setStartDate(null);
      setEndDate(null);
      setFilterBy("tanggal_pengaduan");
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = useCallback((data: PengaduanBulananData) => {
    if (!data.id) {
      toast.error("ID tidak valid. Silakan coba lagi.");
      return;
    }

    setIsEditing(true);
    setEditData(data);
    setFormData({
      nik_pengaduan: data.nik_pengaduan || "",
      nama_pengaduan: data.nama_pengaduan || "",
      alasan_pengaduan: data.alasan_pengaduan || "",
      deskripsi_pengaduan: data.deskripsi_pengaduan || "",
      nomor_telepon: data.nomor_telepon || "",
      tindak_lanjut_pengaduan: data.tindak_lanjut_pengaduan || "",
      tanggal_pengaduan:
        data.tanggal_pengaduan || new Date().toISOString().split("T")[0],
    });
    setShowForm(true);
    setShowRekap(false);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!id) {
        toast.error("ID tidak valid. Silakan coba lagi.");
        return;
      }

      if (!user) {
        toast.error("Pengguna tidak ditemukan. Silakan login kembali.");
        router.push("/");
        return;
      }

      if (!confirm("Apakah Anda yakin ingin menghapus pengaduan ini?")) return;

      try {
        const { data: existingData, error: fetchError } = await supabase
          .from("pengaduan_bulanan")
          .select("id, user_id")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) {
          throw new Error(`Gagal memeriksa data: ${fetchError.message}`);
        }

        if (!existingData) {
          throw new Error(
            "Data tidak ditemukan atau Anda tidak memiliki akses.",
          );
        }

        const { data, error } = await supabase
          .from("pengaduan_bulanan")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .maybeSingle();

        if (error) {
          throw new Error(`Gagal menghapus data: ${error.message}`);
        }

        if (!data) {
          throw new Error("Data tidak ditemukan atau tidak dapat dihapus.");
        }

        toast.success("Pengaduan berhasil dihapus!");

        const rowsPerPage = 5;
        const totalPages = Math.ceil(totalCount / rowsPerPage);

        if (
          rekapData.length === 1 &&
          currentPage === totalPages &&
          currentPage > 1
        ) {
          setCurrentPage(currentPage - 1);
        } else {
          const { totalCount: newTotalCount } = await memoizedFetchRekapData(
            currentPage,
            searchQuery,
            startDate,
            endDate,
            filterBy,
          );
          setTotalCount(newTotalCount);
        }
      } catch (error: any) {
        toast.error(
          error.message || "Gagal menghapus data. Silakan coba lagi.",
        );
      }
    },
    [
      user,
      router,
      rekapData,
      currentPage,
      totalCount,
      memoizedFetchRekapData,
      searchQuery,
      startDate,
      endDate,
      filterBy,
    ],
  );

  const handleRekapitulasi = useCallback(() => {
    setShowRekap(true);
    setShowForm(false);
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
    setShowForm(false);
    setIsEditing(false);
    setEditData(null);
    setFormData({
      nik_pengaduan: "",
      nama_pengaduan: "",
      alasan_pengaduan: "",
      deskripsi_pengaduan: "",
      nomor_telepon: "",
      tindak_lanjut_pengaduan: "",
      tanggal_pengaduan: new Date().toISOString().split("T")[0],
    });
    setShowRekap(true);
  }, []);

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
      userRole,
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
      userRole,
      isTableLoading,
    ],
  );

  if (isFetchingUser) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 dark:from-gray-900 dark:to-gray-800 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-xl dark:bg-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Sesi Tidak Ditemukan
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Sesi Anda telah berakhir atau Anda belum login. Silakan login
            kembali untuk melanjutkan.
          </p>
          <Link href="/" className="hover:text-primary-dark text-primary">
            Kembali ke Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

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
                <span className="text-muted-foreground">Aktivitas User</span>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  Pengaduan Bulanan
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
                  <PengaduanBulananHeader />

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

                    <Badge
                      variant="outline"
                      className="gap-2 px-3 py-1 text-xs"
                    >
                      <Clock className="h-3 w-3" />
                      <span>
                        Last updated {new Date().toLocaleTimeString()}
                      </span>
                    </Badge>

                    {pageStats.currentMode === "form" && (
                      <Badge variant="default" className="gap-2 px-3 py-1">
                        <Sparkles className="h-4 w-4" />
                        <span>Form Mode</span>
                      </Badge>
                    )}

                    {pageStats.currentMode === "table" && (
                      <Badge variant="default" className="gap-2 px-3 py-1">
                        <TrendingUp className="h-4 w-4" />
                        <span>Table Mode</span>
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

                  {userRole === "admin" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="transition-all duration-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20"
                        >
                          <Shield className="h-4 w-4" />
                          <span className="ml-2 hidden sm:inline">Admin</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Admin privileges active</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
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
              <PengaduanBulananActions
                onAjukan={() => {
                  setShowForm(true);
                  setShowRekap(false);
                  setIsEditing(false);
                  setEditData(null);
                  setFormData({
                    nik_pengaduan: "",
                    nama_pengaduan: "",
                    alasan_pengaduan: "",
                    deskripsi_pengaduan: "",
                    nomor_telepon: "",
                    tindak_lanjut_pengaduan: "",
                    tanggal_pengaduan: new Date().toISOString().split("T")[0],
                  });
                }}
                onRekapitulasi={handleRekapitulasi}
                activeMode={showForm ? "form" : showRekap ? "table" : "none"}
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

              {/* Enhanced Content Section */}
              <div className="mt-8 space-y-6">
                <AnimatePresence mode="wait">
                  {showForm && (
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
                        <PengaduanBulananForm
                          formData={formData}
                          setFormData={setFormData}
                          onSubmit={handleSubmit}
                          onCancel={handleCancel}
                          loading={loading}
                          isEditing={isEditing}
                          editData={editData}
                          userRole={userRole}
                        />
                      </div>
                    </motion.div>
                  )}

                  {showRekap && (
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
                          <PengaduanBulananTable {...memoizedTableProps} />
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
                                setShowForm(true);
                                setShowRekap(false);
                              }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {!showForm && !showRekap && (
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
                            setShowForm(true);
                            setShowRekap(false);
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
    </TooltipProvider>
  );
}
