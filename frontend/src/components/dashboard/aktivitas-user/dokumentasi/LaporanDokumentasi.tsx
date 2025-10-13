"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
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
  Trash2,
  Calendar,
  User,
  FileText,
  ZoomIn,
  X,
  Download,
  Share2,
  Eye,
  Filter,
  Grid3X3,
  List,
  Search,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Target,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/conn/supabaseClient";
import type { Dokumentasi } from "@/app/(protected)/aktivitas-user/dokumentasi/page";

// Enhanced interface with enterprise-grade features
interface LaporanDokumentasiProps {
  /** Documentation list data */
  dokumentasiList: Dokumentasi[];
  /** Delete handler function */
  onDelete: (id: string) => void;
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
  /** View mode */
  viewMode?: "grid" | "list";
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable sorting */
  enableSorting?: boolean;
}

export default function LaporanDokumentasi({
  dokumentasiList,
  onDelete,
  className,
  delay = 0.5,
  disableAnimations = false,
  loading = false,
  error = false,
  viewMode: initialViewMode = "grid",
  enableFiltering = true,
  enableSorting = true,
}: LaporanDokumentasiProps) {
  // State management for enhanced UX
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [sortBy, setSortBy] = useState<"date" | "title" | "author">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
      indigo: {
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        text: "text-indigo-700 dark:text-indigo-300",
        accent: "text-indigo-600 dark:text-indigo-400",
        bgClass: "bg-indigo-50 dark:bg-indigo-900/20",
        borderClass: "border-indigo-200 dark:border-indigo-800",
        glowClass: "shadow-indigo-500/20",
      },
    }),
    [],
  );

  const getImageUrl = (fileName: string | null): string => {
    if (!fileName) return "/placeholder.svg";
    const { data } = supabase.storage
      .from("dokumentasi-foto")
      .getPublicUrl(fileName);
    return data.publicUrl || "/placeholder.svg";
  };

  // Enhanced date formatting with better error handling
  const formatDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Tanggal Tidak Valid";
      }
      return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Tanggal Tidak Valid";
    }
  }, []);

  // Enhanced filtering and sorting logic
  const filteredAndSortedData = useMemo(() => {
    let filtered = dokumentasiList;

    // Apply filtering
    if (filterText.trim()) {
      filtered = filtered.filter(
        (doc) =>
          doc.judul.toLowerCase().includes(filterText.toLowerCase()) ||
          doc.keterangan.toLowerCase().includes(filterText.toLowerCase()) ||
          (doc.profiles?.name || "")
            .toLowerCase()
            .includes(filterText.toLowerCase()),
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "date":
          comparison =
            new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
          break;
        case "title":
          comparison = a.judul.localeCompare(b.judul);
          break;
        case "author":
          comparison = (a.profiles?.name || "").localeCompare(
            b.profiles?.name || "",
          );
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [dokumentasiList, filterText, sortBy, sortOrder]);

  // Enhanced lightbox functionality
  const handleZoom = useCallback((imageUrl: string, title: string) => {
    setSelectedImage(imageUrl);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setSelectedImage(null);
  }, []);

  // Enhanced delete handler with confirmation
  const handleDelete = useCallback(
    (id: string, title: string) => {
      if (
        window.confirm(
          `Apakah Anda yakin ingin menghapus dokumentasi "${title}"?`,
        )
      ) {
        onDelete(id);
      }
    },
    [onDelete],
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
        {/* Enhanced Header with Controls */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-background/80 p-6 shadow-lg backdrop-blur-sm"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div
              className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl",
                colorSchemes.green.bgClass,
                "opacity-20",
              )}
            />
          </div>

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
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
                  <FileText
                    className={cn("h-6 w-6", colorSchemes.green.accent)}
                  />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-foreground laptop:text-2xl">
                    Laporan Dokumentasi
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      <Target className="w-3 h-3 mr-1" />
                      {filteredAndSortedData.length} item
                    </span>
                    {filteredAndSortedData.length !==
                      dokumentasiList.length && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                        <Filter className="w-3 h-3 mr-1" />
                        Difilter
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Controls */}
            <div className="flex items-center gap-2">
              {enableFiltering && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari dokumentasi..."
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      className="block w-48 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    />
                    {filterText && (
                      <button
                        onClick={() => setFilterText("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Hapus pencarian"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {enableSorting && (
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </button>
              )}

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    viewMode === "grid"
                      ? "text-white bg-blue-700 border border-blue-700"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    viewMode === "list"
                      ? "text-white bg-blue-700 border border-blue-700"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Gallery Grid */}
        <motion.div
          variants={itemVariants}
          className={cn(
            "grid gap-4 transition-all duration-300",
            viewMode === "grid"
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 laptop:gap-6"
              : "grid-cols-1",
          )}
        >
          {filteredAndSortedData.map((doc, index) => {
            const imageUrl = getImageUrl(doc.foto);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300",
                  "rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm",
                  "hover:border-primary/30 hover:shadow-xl hover:shadow-black/5",
                  viewMode === "list" && "flex gap-4",
                )}
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

                <div className="relative z-10 h-full border-0 bg-transparent shadow-none">
                  <div className="p-0">
                    {doc.foto && (
                      <div className="relative aspect-video w-full">
                        <Image
                          src={imageUrl}
                          alt={doc.judul}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <motion.div
                          className="absolute right-2 top-2"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                                onClick={() => handleZoom(imageUrl, doc.judul)}
                                title="Perbesar gambar"
                              >
                                <ZoomIn className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Perbesar gambar</p>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      </div>
                    )}
                    {/* Enhanced content area */}
                    <div
                      className={cn(
                        "space-y-3",
                        viewMode === "grid" ? "p-4" : "flex-1 py-2 pr-4",
                      )}
                    >
                      <div className="space-y-2">
                        <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
                          {doc.judul}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {doc.keterangan}
                        </p>
                      </div>

                      {/* Enhanced metadata */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(doc.tanggal)}</span>
                        </div>
                        {doc.profiles && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{doc.profiles.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced footer */}
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aktif
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 dark:hover:text-gray-300"
                              title="Lihat detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lihat detail</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDelete(doc.id, doc.judul)}
                              className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                              title="Hapus dokumentasi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Hapus dokumentasi</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Enhanced Lightbox Dialog */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl overflow-hidden border-border/50 bg-background/95 p-0 backdrop-blur-md">
            <DialogHeader className="sr-only">
              <DialogTitle>Preview Dokumentasi</DialogTitle>
              <DialogDescription>
                Preview gambar dokumentasi dalam ukuran penuh
              </DialogDescription>
            </DialogHeader>

            {selectedImage && (
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
                    src={selectedImage}
                    alt="Preview dokumentasi"
                    fill
                    className="object-contain transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    priority
                  />

                  {/* Close button */}
                  <motion.button
                    className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70"
                    onClick={closeLightbox}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Tutup preview"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                {/* Enhanced Image Info */}
                <div className="border-t border-border/50 bg-background/80 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">
                        Preview Dokumentasi
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Klik dan drag untuk melihat detail gambar
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        aria-label="Download gambar"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 dark:hover:text-gray-300"
                        aria-label="Bagikan gambar"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  );
}