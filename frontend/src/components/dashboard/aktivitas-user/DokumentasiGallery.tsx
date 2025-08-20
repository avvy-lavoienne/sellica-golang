"use client"

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  FolderOpen,
  Calendar,
  FileText,
  Eye,
  Grid3X3,
  List,
  Download,
  AlertCircle,
  Share2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";
import { supabase } from "@/lib/conn/supabaseClient";
import type { Dokumentasi } from "@/app/(protected)/aktivitas-user/dokumentasi/page";

// Enhanced interface with enterprise-grade features
interface DokumentasiGalleryProps {
  /** Documentation data array */
  data: Dokumentasi[];
  /** Loading state */
  loading: boolean;
  /** Navigation function */
  onNavigate: (path: string) => void;
  /** Custom className */
  className?: string;
  /** Animation delay */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Error state */
  error?: boolean;
}

export function DokumentasiGallery({
  data,
  loading,
  onNavigate,
  className,
  delay = 0.6,
  disableAnimations = false,
  error = false,
}: DokumentasiGalleryProps) {
  // State management for enhanced UX
  const [startIndex, setStartIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [imageLoadingStates, setImageLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

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
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200 dark:border-indigo-800",
        glowClass: "shadow-indigo-500/20",
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

  const itemsToShow = viewMode === "grid" ? 3 : 4;

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - itemsToShow));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(data.length - 1, prev + itemsToShow));
  };

  // Use useMemo to prevent visibleData from being recalculated on every render
  const visibleData = useMemo(() => {
    return data.slice(startIndex, startIndex + itemsToShow);
  }, [data, startIndex, itemsToShow]);

  const hasMore = startIndex + itemsToShow < data.length;
  const hasPrevious = startIndex > 0;

  // Enhanced image loading with better error handling and loading states
  useEffect(() => {
    // Skip if no data or still loading
    if (!visibleData.length || loading) {
      return;
    }

    const loadImageUrls = async () => {
      const urls: Record<string, string> = {};
      const loadingStates: Record<string, boolean> = {};
      const errorStates: Record<string, boolean> = {};

      for (const item of visibleData) {
        if (item.foto) {
          try {
            // Set loading state
            loadingStates[item.id] = true;
            setImageLoadingStates((prev) => ({ ...prev, [item.id]: true }));

            const { data } = supabase.storage
              .from("dokumentasi-foto")
              .getPublicUrl(item.foto);

            if (data?.publicUrl) {
              urls[item.id] = data.publicUrl;
              loadingStates[item.id] = false;
              errorStates[item.id] = false;
            } else {
              errorStates[item.id] = true;
              loadingStates[item.id] = false;
            }
          } catch (error) {
            console.error(`Error getting URL for image ${item.foto}:`, error);
            errorStates[item.id] = true;
            loadingStates[item.id] = false;
          }
        }
      }

      setImageUrls((prev) => ({ ...prev, ...urls }));
      setImageLoadingStates((prev) => ({ ...prev, ...loadingStates }));
      setImageErrors((prev) => ({ ...prev, ...errorStates }));
    };

    loadImageUrls();
  }, [visibleData, loading]); // Only depend on memoized visibleData and loading state

  // Calculate summary statistics
  const totalItems = data.length;
  const currentPage = Math.floor(startIndex / itemsToShow) + 1;
  const totalPages = Math.ceil(totalItems / itemsToShow);
  const hasImages = data.some((item) => item.foto);
  const recentItems = data.filter((item) => {
    const itemDate = new Date(item.tanggal);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return itemDate >= weekAgo;
  }).length;

  // Enhanced placeholder image with better design
  const getPlaceholderImage = (index: number, isError: boolean = false) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-amber-500 to-amber-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
    ];

    return (
      <div
        className={cn(
          "relative flex h-36 w-full items-center justify-center rounded-t-lg transition-all duration-300",
          isError
            ? "bg-gradient-to-br from-muted to-muted/80"
            : colors[index % colors.length],
        )}
      >
        <div className="flex flex-col items-center space-y-2">
          {isError ? (
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          ) : (
            <ImageIcon className="h-10 w-10 text-white/90" />
          )}
          <span className="text-xs font-medium text-white/80">
            {isError ? "Gagal memuat" : "Tidak ada foto"}
          </span>
        </div>
        {!isError && (
          <div className="absolute inset-0 rounded-t-lg bg-black/10" />
        )}
      </div>
    );
  };

  const formatDateSafely = (dateString: string) => {
    if (!dateString) return "Tanggal tidak tersedia";

    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return "Tanggal tidak valid";
      return format(dateObj, "dd MMMM yyyy", { locale: id });
    } catch (error) {
      return "Format tanggal error";
    }
  };

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
    hover: {
      y: -2,
      scale: 1.01,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
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

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLightboxImage(null);
  }, []);

  // Keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape" && lightboxOpen) {
        closeLightbox();
      }
    },
    [lightboxOpen, closeLightbox],
  );

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className={cn("relative col-span-full", className)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Galeri Dokumentasi"
      >
        <Card
          className={cn(
            "group relative h-full overflow-hidden border-border/50 bg-background/80 shadow-lg backdrop-blur-sm transition-all duration-300",
            // Enhanced interactive states
            "hover:shadow-xl hover:shadow-black/5",
            colorSchemes.primary.glowClass,
            // Focus and hover enhancements
            isHovered && ["shadow-xl", "shadow-black/10 dark:shadow-white/5"],
            isFocused && "ring-2 ring-primary/50 ring-offset-2",
            // Loading and error states
            loading && "animate-pulse",
            error && "border-destructive/50 bg-destructive/5",
          )}
        >
          {/* Enhanced background decoration with sophisticated glow effects */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {/* Primary glow effect */}
            <div
              className={cn(
                "absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
                colorSchemes.primary.bgClass,
                "opacity-20",
              )}
            />
            {/* Secondary glow effect for depth */}
            <div
              className={cn(
                "absolute -bottom-4 -left-4 h-20 w-20 rounded-full blur-2xl",
                colorSchemes.green.bgClass,
                "opacity-15",
              )}
            />
          </div>
          {/* Enhanced Header with Glass-morphism */}
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-4 laptop:pb-6">
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200",
                    colorSchemes.green.bgClass,
                    colorSchemes.green.borderClass,
                    "group-hover:scale-105 group-hover:shadow-md",
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FolderOpen
                    className={cn("h-6 w-6", colorSchemes.green.accent)}
                  />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground laptop:text-2xl">
                    Galeri Dokumentasi
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <motion.div variants={itemVariants}>
                      <Badge
                        variant="secondary"
                        className="gap-1 text-xs transition-all duration-200 hover:bg-secondary/80"
                      >
                        <FileText className="h-3 w-3" />
                        {totalItems} item
                      </Badge>
                    </motion.div>
                    {recentItems > 0 && (
                      <motion.div variants={itemVariants}>
                        <Badge
                          variant="outline"
                          className="gap-1 text-xs transition-all duration-200 hover:bg-primary/10"
                        >
                          <Sparkles className="h-3 w-3" />
                          {recentItems} baru
                        </Badge>
                      </motion.div>
                    )}
                    {hasImages && (
                      <motion.div variants={itemVariants}>
                        <Badge
                          variant="outline"
                          className="gap-1 text-xs transition-all duration-200 hover:bg-green/10"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Foto
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <CardDescription className="max-w-md text-sm text-muted-foreground">
                Koleksi dokumentasi terbaru yang telah direkam dalam sistem
                dengan preview visual dan navigasi yang mudah
              </CardDescription>
            </motion.div>

            {/* Enhanced Controls */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 laptop:gap-3"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 px-3 transition-all duration-200 hover:border-primary/30",
                        viewMode === "grid" &&
                          "border-primary/30 bg-primary/10 text-primary",
                      )}
                      onClick={() => setViewMode("grid")}
                      aria-label="Tampilan grid"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="space-y-1">
                    <p className="font-medium">Tampilan Grid</p>
                    <p className="text-xs text-muted-foreground">
                      Tampilkan dalam format kartu
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 px-3 transition-all duration-200 hover:border-primary/30",
                        viewMode === "list" &&
                          "border-primary/30 bg-primary/10 text-primary",
                      )}
                      onClick={() => setViewMode("list")}
                      aria-label="Tampilan list"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="space-y-1">
                    <p className="font-medium">Tampilan List</p>
                    <p className="text-xs text-muted-foreground">
                      Tampilkan dalam format daftar
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 px-3 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10"
                      onClick={() => onNavigate("/aktivitas-user/dokumentasi")}
                      aria-label="Lihat semua dokumentasi"
                    >
                      <Eye className="h-4 w-4" />
                      Lihat Semua
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="space-y-1">
                    <p className="font-medium">Lihat Semua</p>
                    <p className="text-xs text-muted-foreground">
                      Buka halaman dokumentasi lengkap
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          </CardHeader>

          {/* Enhanced Content */}
          <CardContent className="relative z-10 space-y-6">
            {/* Enhanced Summary Stats */}
            {!loading && data.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div
                    className={cn(
                      "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl",
                      colorSchemes.indigo.bgClass,
                      "opacity-20",
                    )}
                  />
                </div>

                <div className="relative z-10 grid grid-cols-3 gap-4 text-center laptop:grid-cols-4">
                  <motion.div
                    variants={itemVariants}
                    className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3 transition-all duration-200 hover:bg-primary/10"
                  >
                    <p className="text-2xl font-bold text-primary laptop:text-3xl">
                      {totalItems}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Item
                    </p>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="space-y-2 rounded-lg border border-indigo-200/60 bg-indigo-50/50 p-3 transition-all duration-200 hover:bg-indigo-50/80 dark:border-indigo-700/60 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30"
                  >
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 laptop:text-3xl">
                      {currentPage}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Halaman
                    </p>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="space-y-2 rounded-lg border border-amber-200/60 bg-amber-50/50 p-3 transition-all duration-200 hover:bg-amber-50/80 dark:border-amber-700/60 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
                  >
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 laptop:text-3xl">
                      {totalPages}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Total Hal.
                    </p>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="hidden space-y-2 rounded-lg border border-green-200/60 bg-green-50/50 p-3 transition-all duration-200 hover:bg-green-50/80 dark:border-green-700/60 dark:bg-green-900/20 dark:hover:bg-green-900/30 laptop:block"
                  >
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 laptop:text-3xl">
                      {recentItems}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">
                      Baru
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Enhanced Gallery Container */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Enhanced Loading Stats */}
                  <div className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 p-4 backdrop-blur-sm">
                    <div className="grid grid-cols-3 gap-4 text-center laptop:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                          className="space-y-2 rounded-lg border border-muted/50 bg-muted/20 p-3"
                        >
                          <Skeleton className="mx-auto h-8 w-16 rounded-lg" />
                          <Skeleton className="mx-auto h-3 w-20 rounded-md" />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Loading Gallery */}
                  <div
                    className={cn(
                      "grid gap-4 transition-all duration-300",
                      viewMode === "grid"
                        ? "grid-cols-1 md:grid-cols-2 laptop:grid-cols-3"
                        : "grid-cols-1",
                    )}
                  >
                    {Array.from({ length: itemsToShow }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.1 }}
                        className={cn(
                          "overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm",
                          viewMode === "list" && "flex gap-4",
                        )}
                      >
                        <div
                          className={cn(
                            "relative overflow-hidden",
                            viewMode === "grid"
                              ? "h-36 w-full"
                              : "h-24 w-32 flex-shrink-0",
                          )}
                        >
                          <Skeleton className="h-full w-full" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                        </div>
                        <div
                          className={cn(
                            "space-y-3",
                            viewMode === "grid" ? "p-4" : "flex-1 py-2 pr-4",
                          )}
                        >
                          <Skeleton
                            className={cn(
                              "h-4",
                              viewMode === "grid" ? "w-3/4" : "w-full",
                            )}
                          />
                          <Skeleton
                            className={cn(
                              "h-3",
                              viewMode === "grid" ? "w-full" : "w-2/3",
                            )}
                          />
                          <Skeleton
                            className={cn(
                              "h-3",
                              viewMode === "grid" ? "w-1/2" : "w-1/3",
                            )}
                          />
                          {viewMode === "grid" && (
                            <div className="flex items-center justify-between pt-2">
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : data.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm"
                >
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-50">
                    <div
                      className={cn(
                        "absolute left-1/4 top-1/4 h-24 w-24 rounded-full blur-2xl",
                        colorSchemes.green.bgClass,
                        "opacity-30",
                      )}
                    />
                    <div
                      className={cn(
                        "absolute bottom-1/4 right-1/4 h-16 w-16 rounded-full blur-xl",
                        colorSchemes.indigo.bgClass,
                        "opacity-20",
                      )}
                    />
                  </div>

                  <div className="relative z-10 flex h-64 items-center justify-center p-8">
                    <div className="space-y-6 text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex justify-center"
                      >
                        <div
                          className={cn(
                            "flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all duration-300",
                            colorSchemes.green.bgClass,
                            colorSchemes.green.borderClass,
                            "shadow-lg",
                          )}
                        >
                          <FolderOpen
                            className={cn(
                              "h-10 w-10",
                              colorSchemes.green.accent,
                            )}
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="space-y-3"
                      >
                        <h3 className="text-xl font-bold text-foreground">
                          Belum ada dokumentasi
                        </h3>
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="gap-1 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            Galeri Kosong
                          </Badge>
                        </div>
                      </motion.div>

                      <motion.p
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="max-w-sm text-sm leading-relaxed text-muted-foreground"
                      >
                        Belum ada dokumentasi yang direkam dalam sistem. Mulai
                        tambahkan dokumentasi pertama Anda untuk membangun
                        galeri.
                      </motion.p>

                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() =>
                            onNavigate("/aktivitas-user/dokumentasi")
                          }
                          className="gap-2 px-6 py-2 transition-all duration-200 hover:shadow-lg"
                          size="lg"
                        >
                          <FileText className="h-5 w-5" />
                          Tambah Dokumentasi
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="gallery"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div
                    className={cn(
                      "grid gap-4 transition-all duration-300",
                      viewMode === "grid"
                        ? "grid-cols-1 md:grid-cols-2 laptop:grid-cols-3"
                        : "grid-cols-1",
                    )}
                  >
                    {visibleData.map((item, index) => (
                      <motion.div
                        key={item.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={cn(
                          "group relative cursor-pointer overflow-hidden transition-all duration-300",
                          "rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm",
                          "hover:border-primary/30 hover:shadow-xl hover:shadow-black/5",
                          selectedItem === item.id &&
                            "border-primary/50 ring-2 ring-primary/50 ring-offset-2",
                          viewMode === "list" && "flex gap-4",
                        )}
                        onClick={() => {
                          setSelectedItem(item.id);
                          onNavigate(
                            `/aktivitas-user/dokumentasi?id=${item.id}`,
                          );
                        }}
                        whileHover={{
                          y: viewMode === "grid" ? -4 : 0,
                          scale: viewMode === "list" ? 1.01 : 1.02,
                        }}
                        whileTap={{ scale: 0.98 }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Dokumentasi: ${item.judul}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedItem(item.id);
                            onNavigate(
                              `/aktivitas-user/dokumentasi?id=${item.id}`,
                            );
                          }
                        }}
                      >
                        {/* Enhanced background decoration */}
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div
                            className={cn(
                              "absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl",
                              colorSchemes.green.bgClass,
                              "opacity-20",
                            )}
                          />
                        </div>

                        {/* Enhanced Image area */}
                        <div
                          className={cn(
                            "relative overflow-hidden",
                            viewMode === "grid"
                              ? "h-36 w-full"
                              : "h-24 w-32 flex-shrink-0",
                          )}
                        >
                          {imageLoadingStates[item.id] ? (
                            <div className="flex h-full w-full animate-pulse items-center justify-center bg-muted">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                            </div>
                          ) : imageUrls[item.id] ? (
                            <>
                              <Image
                                src={imageUrls[item.id]}
                                alt={item.judul || "Dokumentasi"}
                                fill
                                unoptimized
                                sizes={
                                  viewMode === "grid"
                                    ? "(max-width: 768px) 100vw, 33vw"
                                    : "128px"
                                }
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={() =>
                                  setImageErrors((prev) => ({
                                    ...prev,
                                    [item.id]: true,
                                  }))
                                }
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                              <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <Badge
                                  variant="secondary"
                                  className="gap-1 text-xs"
                                >
                                  <Eye className="h-3 w-3" />
                                  Lihat
                                </Badge>
                              </div>
                            </>
                          ) : (
                            getPlaceholderImage(index, imageErrors[item.id])
                          )}

                          {/* Image overlay for grid view */}
                          {viewMode === "grid" && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                              <div className="flex items-center justify-between text-xs text-white">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDateSafely(item.tanggal)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Dok
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Enhanced Content area */}
                        <div
                          className={cn(
                            "space-y-2",
                            viewMode === "grid" ? "p-4" : "flex-1 py-2 pr-4",
                          )}
                        >
                          <div className="space-y-1">
                            <h3
                              className={cn(
                                "line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary",
                                viewMode === "grid" ? "text-base" : "text-sm",
                              )}
                            >
                              {item.judul || "Tanpa judul"}
                            </h3>
                            {viewMode === "list" && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDateSafely(item.tanggal)}
                              </div>
                            )}
                          </div>

                          <p
                            className={cn(
                              "line-clamp-2 text-muted-foreground",
                              viewMode === "grid" ? "text-sm" : "text-xs",
                            )}
                          >
                            {item.keterangan || "Tidak ada keterangan"}
                          </p>

                          {viewMode === "grid" && (
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDateSafely(item.tanggal)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                <FileText className="mr-1 h-3 w-3" />
                                Dokumentasi
                              </Badge>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Enhanced Navigation Controls */}
                  {(hasPrevious || hasMore) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="flex items-center justify-between border-t pt-4"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          Halaman {currentPage} dari {totalPages}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {totalItems} total
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasPrevious}
                              onClick={handlePrevious}
                              className="h-9 gap-2 px-3 transition-all duration-200 hover:scale-105"
                            >
                              <ChevronLeftIcon className="h-4 w-4" />
                              Sebelumnya
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Halaman sebelumnya</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!hasMore}
                              onClick={handleNext}
                              className="h-9 gap-2 px-3 transition-all duration-200 hover:scale-105"
                            >
                              Selanjutnya
                              <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Halaman selanjutnya</TooltipContent>
                        </Tooltip>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl overflow-hidden border-border/50 bg-background/95 p-0 backdrop-blur-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Preview Dokumentasi</DialogTitle>
            <DialogDescription>
              {lightboxImage?.title || "Preview gambar dokumentasi"}
            </DialogDescription>
          </DialogHeader>

          {lightboxImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Enhanced Image Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-black/5">
                <Image
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  fill
                  className="object-contain transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  priority
                />

                {/* Enhanced overlay controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Close button */}
                <motion.button
                  className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70"
                  onClick={closeLightbox}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Tutup preview"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>

              {/* Enhanced Image Info */}
              <div className="border-t border-border/50 bg-background/80 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">
                      {lightboxImage.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Klik dan drag untuk melihat detail gambar
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      className="rounded-lg border border-border/50 bg-background/50 p-2 text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Download gambar"
                    >
                      <Download className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      className="rounded-lg border border-border/50 bg-background/50 p-2 text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      aria-label="Bagikan gambar"
                    >
                      <Share2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}