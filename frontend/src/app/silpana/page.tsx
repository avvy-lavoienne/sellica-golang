"use client";

import type React from "react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  SilpanaData,
  SilpanaFormData,
} from "@/types/silpana/silpana";
import SilpanaHeader from "@/components/silpana/SilpanaHeader";
import SilpanaActions from "@/components/silpana/SilpanaActions";
import SilpanaForm from "@/components/silpana/SilpanaForm";
import SilpanaTable from "@/components/silpana/SilpanaTable";
import EmptyState from "@/components/silpana/EmptyState";
import LoadingState from "@/components/silpana/LoadingState";

export default function SilpanaPage() {
  // Enhanced state management for public SILPANA page
  const [showForm, setShowForm] = useState(false);
  const [showRekap, setShowRekap] = useState(true); // Default to showing data for public access
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SilpanaData | null>(null);
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

        const { data: silpanaData, error, count } = await query;

        if (error) {
          throw new Error(`Gagal mengambil data SILPANA: ${error.message}`);
        }

        setRekapData(silpanaData || []);
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
    if (showRekap && !showForm) {
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
    showForm,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For public SILPANA page, we'll disable form submission for now
    toast.info("Form submission is not available for public access.");
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
    setShowForm(true);
    setShowRekap(false);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      // Disable delete for public access
      toast.info("Delete functionality is not available for public access.");
      return;
    },
    [], // No dependencies needed for disabled function
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
      kategori_pengaduan: "",
      sub_kategori_pengaduan: "",
      alasan_pengaduan: "",
      deskripsi_pengaduan: "",
      nomor_telepon: "",
      tindak_lanjut_pengaduan: "",
      tanggal_pengaduan: new Date().toISOString().split("T")[0],
      is_anonymous: false,
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
              <SilpanaActions
                onAjukan={() => {
                  setShowForm(true);
                  setShowRekap(false);
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
                        <SilpanaForm
                          formData={formData}
                          setFormData={setFormData}
                          onSubmit={handleSubmit}
                          onCancel={handleCancel}
                          loading={loading}
                          isEditing={isEditing}
                          editData={editData}
                          userRole="public"
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
