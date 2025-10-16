"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  FileText,
  Home,
  Activity,
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
} from "lucide-react";
import DokumentasiHeader from "@/components/dashboard/aktivitas-user/dokumentasi/DokumentasiHeader";
import DokumentasiActions from "@/components/dashboard/aktivitas-user/dokumentasi/DokumentasiActions";
import InputDokumentasi from "@/components/dashboard/aktivitas-user/dokumentasi/InputDokumentasi";
import LaporanDokumentasi from "@/components/dashboard/aktivitas-user/dokumentasi/LaporanDokumentasi";
import EmptyState from "@/components/dashboard/aktivitas-user/dokumentasi/EmptyState";
import LoadingState from "@/components/dashboard/aktivitas-user/dokumentasi/LoadingState";
import { useDebounce } from "@/hooks/use-debounce";

export interface Dokumentasi {
  id: string;
  tanggal: string;
  foto: string | null;
  judul: string;
  keterangan: string;
  created_by: string;
  created_at?: string;
  profiles: {
    name: string;
    avatar_url?: string;
  } | null;
}

export default function DokumentasiPage() {
  // Enhanced state management for enterprise UX
  const [dokumentasiList, setDokumentasiList] = useState<Dokumentasi[]>([]);
  const [activeTab, setActiveTab] = useState<string>("input");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [filterBy, setFilterBy] = useState<"tanggal" | "created_at">("tanggal");
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pageStats, setPageStats] = useState({
    totalItems: 0,
    filteredItems: 0,
    lastUpdated: new Date(),
  });

  // Refs for enhanced functionality
  const containerRef = useRef<HTMLDivElement>(null);

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

  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedFilterBy = useDebounce(filterBy, 300);

  // Enhanced fetch function with statistics and error handling
  const fetchDokumentasi = useCallback(
    async (
      search: string = "",
      start: Date | null = null,
      end: Date | null = null,
      filterField: "tanggal" | "created_at" = "tanggal",
    ) => {
      try {
        setRefreshing(true);
        setError(null);

        // First, get total count for statistics
        const { count: totalCount } = await supabase
          .from("dokumentasi")
          .select("*", { count: "exact", head: true });

        let queryBuilder = supabase
          .from("dokumentasi")
          .select("*")
          .order("created_at", { ascending: false });

        if (search) {
          queryBuilder = queryBuilder.or(
            `judul.ilike.%${encodeURIComponent(search)}%,keterangan.ilike.%${encodeURIComponent(search)}%`,
          );
        }

        if (start && end) {
          const startDateObj = new Date(start);
          const endDateObj = new Date(end);

          if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            const errorMsg =
              "Tanggal tidak valid. Silakan pilih tanggal yang benar.";
            setError(errorMsg);
            toast.error(errorMsg);
            return;
          }

          if (endDateObj < startDateObj) {
            const errorMsg = "Tanggal akhir tidak boleh sebelum tanggal mulai.";
            setError(errorMsg);
            toast.error(errorMsg);
            return;
          }

          startDateObj.setUTCHours(0, 0, 0, 0);
          endDateObj.setUTCHours(23, 59, 59, 999);

          const startISO = startDateObj.toISOString();
          const endISO = endDateObj.toISOString();

          queryBuilder = queryBuilder
            .gte(filterField, startISO)
            .lte(filterField, endISO);
        }

        const { data: dokumentasiData, error: dokumentasiError } =
          await queryBuilder;

        if (dokumentasiError) {
          throw dokumentasiError;
        }

        const validatedData =
          dokumentasiData?.filter(
            (doc): doc is Dokumentasi => doc.id && doc.judul && doc.tanggal,
          ) || [];

        if (validatedData.length > 0) {
          const userIds = [
            ...new Set(validatedData.map((doc) => doc.created_by)),
          ];
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .in("id", userIds);

          if (profilesError) {
            console.warn("Error fetching profiles:", profilesError);
          }

          if (profilesData) {
            const profileMap = Object.fromEntries(
              profilesData.map((profile) => [profile.id, profile]),
            );
            validatedData.forEach((doc) => {
              doc.profiles = profileMap[doc.created_by] || {
                name: "Unknown User",
                avatar_url: null,
              };
            });
          }
        }

        // Update statistics
        setPageStats({
          totalItems: totalCount || 0,
          filteredItems: validatedData.length,
          lastUpdated: new Date(),
        });

        setDokumentasiList(validatedData);
      } catch (error: any) {
        const message =
          error.code === "PGRST116"
            ? "Tidak ada data yang ditemukan"
            : error.message || "Gagal mengambil data dokumentasi";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchDokumentasi(
      debouncedSearchTerm,
      debouncedStartDate,
      debouncedEndDate,
      debouncedFilterBy,
    );
  }, [
    debouncedSearchTerm,
    debouncedStartDate,
    debouncedEndDate,
    debouncedFilterBy,
    fetchDokumentasi,
  ]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDateRangeChange = (
    start: Date | null,
    end: Date | null,
    filterField: "tanggal" | "created_at",
  ) => {
    setStartDate(start);
    setEndDate(end);
    setFilterBy(filterField);
  };

  const handleAddDokumentasi = useCallback(
    async (newDokumentasi: Dokumentasi) => {
      setDokumentasiList([newDokumentasi, ...dokumentasiList]);
      toast.success("Dokumentasi berhasil ditambahkan!");
      setTimeout(() => {
        setActiveTab("laporan");
        fetchDokumentasi(searchTerm, startDate, endDate, filterBy);
      }, 500);
    },
    [
      dokumentasiList,
      searchTerm,
      startDate,
      endDate,
      filterBy,
      fetchDokumentasi,
    ],
  );

  const handleDeleteDokumentasi = useCallback(
    async (id: string) => {
      try {
        const doc = dokumentasiList.find((d) => d.id === id);
        if (!doc) throw new Error("Dokumentasi tidak ditemukan");

        const { error: dbError } = await supabase
          .from("dokumentasi")
          .delete()
          .eq("id", id);
        if (dbError) throw dbError;

        if (doc.foto) {
          const { error: storageError } = await supabase.storage
            .from("dokumentasi-foto")
            .remove([doc.foto]);
          if (storageError) throw storageError;
        }

        setDokumentasiList(dokumentasiList.filter((doc) => doc.id !== id));
        toast.success("Dokumentasi berhasil dihapus");
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus dokumentasi");
        await fetchDokumentasi(searchTerm, startDate, endDate, filterBy);
      }
    },
    [
      dokumentasiList,
      searchTerm,
      startDate,
      endDate,
      filterBy,
      fetchDokumentasi,
    ],
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Enhanced content rendering with animations and error handling
  const renderContent = useCallback(() => {
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

    if (loading) {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <LoadingState />
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative overflow-hidden rounded-xl border border-destructive/50 bg-background/80 p-6 shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Error Loading Data
              </h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchDokumentasi("", null, null, "tanggal")}
              className="ml-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </motion.div>
      );
    }

    if (activeTab === "input") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-50">
              <div
                className={cn(
                  "absolute left-1/4 top-1/4 h-32 w-32 rounded-full blur-3xl",
                  colorSchemes.blue.bgClass,
                  "opacity-30",
                )}
              />
              <div
                className={cn(
                  "absolute bottom-1/4 right-1/4 h-24 w-24 rounded-full blur-2xl",
                  colorSchemes.green.bgClass,
                  "opacity-20",
                )}
              />
            </div>

            <div className="relative z-10">
              <InputDokumentasi
                onAddDokumentasi={handleAddDokumentasi}
                loading={refreshing}
              />
            </div>
          </motion.div>
        </motion.div>
      );
    }

    if (activeTab === "laporan") {
      if (dokumentasiList.length === 0) {
        return (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <EmptyState
              title="Belum ada dokumentasi"
              description={
                searchTerm || startDate || endDate
                  ? "Tidak ada dokumentasi yang sesuai dengan filter"
                  : "Belum ada dokumentasi yang tersedia. Silakan tambahkan dokumentasi baru."
              }
              actionLabel={
                searchTerm || startDate || endDate
                  ? "Reset Filter"
                  : "Tambah Dokumentasi"
              }
              onAction={
                searchTerm || startDate || endDate
                  ? () => {
                      setSearchTerm("");
                      setStartDate(null);
                      setEndDate(null);
                      setFilterBy("tanggal");
                    }
                  : () => setActiveTab("input")
              }
            />
          </motion.div>
        );
      }

      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <LaporanDokumentasi
            dokumentasiList={dokumentasiList}
            onDelete={handleDeleteDokumentasi}
          />
        </motion.div>
      );
    }

    return null;
  }, [
    loading,
    error,
    activeTab,
    dokumentasiList,
    searchTerm,
    startDate,
    endDate,
    refreshing,
    shouldAnimate,
    colorSchemes,
    handleAddDokumentasi,
    handleDeleteDokumentasi,
    fetchDokumentasi,
  ]);

  // Animation variants for page-level animations
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
          "container mx-auto space-y-8 p-6 md:p-8 lg:p-12",
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
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
          className="z-50"
        />

        {/* Enhanced Page Header with Statistics */}
        <motion.div
          variants={sectionVariants}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/80 shadow-lg backdrop-blur-sm"
        >
          {/* Background decoration - simplified */}
          <div className="absolute inset-0 opacity-20">
            <div
              className={cn(
                "absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl",
                colorSchemes.primary.bgClass,
                "opacity-30",
              )}
            />
            <div
              className={cn(
                "absolute bottom-1/4 left-1/4 h-32 w-32 rounded-full blur-2xl",
                colorSchemes.blue.bgClass,
                "opacity-20",
              )}
            />
          </div>

          <div className="relative z-10 p-8 md:p-10">
            <div className="flex flex-col gap-8 laptop:flex-row laptop:items-center laptop:justify-between">
              <div className="space-y-6">
                <DokumentasiHeader />

                {/* Enhanced Statistics */}
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="secondary" className="gap-2 px-4 py-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">
                      {pageStats.totalItems} Total
                    </span>
                  </Badge>

                  {pageStats.filteredItems !== pageStats.totalItems && (
                    <Badge variant="outline" className="gap-2 px-4 py-2">
                      <Filter className="h-4 w-4" />
                      <span className="font-medium">
                        {pageStats.filteredItems} Filtered
                      </span>
                    </Badge>
                  )}

                  <Badge variant="outline" className="gap-2 px-4 py-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>
                      Updated {pageStats.lastUpdated.toLocaleTimeString()}
                    </span>
                  </Badge>

                  {activeTab === "input" && (
                    <Badge variant="default" className="gap-2 px-4 py-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Input Mode</span>
                    </Badge>
                  )}

                  {activeTab === "laporan" && (
                    <Badge variant="default" className="gap-2 px-4 py-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Report Mode</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        fetchDokumentasi("", null, null, "tanggal")
                      }
                      disabled={refreshing}
                      className="transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 px-6 py-3"
                    >
                      <RefreshCw
                        className={cn("h-5 w-5", refreshing && "animate-spin")}
                      />
                      <span className="ml-3 hidden sm:inline">
                        {refreshing ? "Refreshing..." : "Refresh All"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh all dokumentasi data</p>
                  </TooltipContent>
                </Tooltip>

                {error && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="lg"
                        onClick={() => setError(null)}
                        className="transition-all duration-200 px-6 py-3"
                      >
                        <AlertCircle className="h-5 w-5" />
                        <span className="ml-3 hidden sm:inline">
                          Clear Error
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear error message</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Actions Section */}
        <motion.div variants={sectionVariants}>
          <DokumentasiActions
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onSearch={handleSearch}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={() => fetchDokumentasi("", null, null, "tanggal")}
            isRefreshing={refreshing}
            totalItems={pageStats.totalItems}
            filteredItems={pageStats.filteredItems}
            loading={loading}
            error={!!error}
          />
        </motion.div>

        {/* Enhanced Content Section */}
        <motion.div variants={sectionVariants}>
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}
