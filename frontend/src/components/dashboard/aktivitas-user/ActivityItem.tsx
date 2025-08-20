"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileTextIcon,
  ActivityIcon,
  FolderIcon,
  ChevronRightIcon,
  Clock,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/conn/utils";

interface ActivityItemProps {
  item: any;
  index: number;
  onNavigate: (path: string) => void;
}

export function ActivityItem({ item, index, onNavigate }: ActivityItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Improved type detection logic
  const isAktivitasSiak =
    !!item.bulan_rekapitulasi || !!item.total_aktivitas_keseluruhan;
  const isPengaduan = !!item.nama_pengaduan || !!item.alasan_pengaduan;
  const isDokumentasi = !!item.judul || !!item.foto;

  // Get appropriate icon
  const Icon = isAktivitasSiak
    ? ActivityIcon
    : isPengaduan
      ? FileTextIcon
      : FolderIcon;

  // Get appropriate title
  const title = isAktivitasSiak
    ? `Aktivitas SIAK - ${item.bulan_rekapitulasi || "N/A"}`
    : isPengaduan
      ? `Pengaduan - ${item.nama_pengaduan || "N/A"}`
      : `Dokumentasi - ${item.judul || "N/A"}`;

  // Get appropriate description
  const description = isAktivitasSiak
    ? `Total aktivitas: ${item.total_aktivitas_keseluruhan || "N/A"}`
    : isPengaduan
      ? item.alasan_pengaduan ||
        item.deskripsi_pengaduan ||
        "Tidak ada deskripsi"
      : item.keterangan || "Tidak ada keterangan";

  // Get appropriate date field and validate it
  const date = isAktivitasSiak
    ? item.created_at
    : isPengaduan
      ? item.created_at
      : item.tanggal;

  // Format date safely with validation
  const formatDateSafely = () => {
    if (!date) return "Tanggal tidak tersedia";

    try {
      const dateObj = new Date(date);
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return "Tanggal tidak valid";
      }
      return format(dateObj, "dd MMMM yyyy", { locale: id });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Format tanggal error";
    }
  };

  // Get appropriate path
  const path = isAktivitasSiak
    ? "/aktivitas-user/aktivitas-siak"
    : isPengaduan
      ? "/aktivitas-user/pengaduan-bulanan"
      : "/aktivitas-user/dokumentasi";

  // Enhanced color scheme based on type
  const getColorScheme = () => {
    if (isAktivitasSiak) {
      return {
        bg: "bg-blue-500/10 hover:bg-blue-500/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        badge:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
      };
    }
    if (isDokumentasi) {
      return {
        bg: "bg-green-500/10 hover:bg-green-500/20",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
        badge:
          "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
      };
    }
    return {
      bg: "bg-amber-500/10 hover:bg-amber-500/20",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    };
  };

  const colors = getColorScheme();

  // Fix hydration mismatch by calculating isRecent on client side only
  const [isRecent, setIsRecent] = useState(false);

  useEffect(() => {
    if (date) {
      const isRecentCalculated =
        Date.now() - new Date(date).getTime() < 24 * 60 * 60 * 1000;
      setIsRecent(isRecentCalculated);
    }
  }, [date]);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={cn(
          "group cursor-pointer rounded-lg border p-4 transition-all duration-300",
          "hover:scale-[1.02] hover:shadow-md",
          colors.border,
          colors.bg,
        )}
        onClick={() => onNavigate(path)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start gap-4">
          {/* Enhanced Icon */}
          <div className="flex-shrink-0">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300",
                colors.bg,
                "ring-1 ring-border",
                isHovered && "scale-110",
              )}
            >
              <Icon className={cn("h-6 w-6", colors.text)} />
            </div>
          </div>

          {/* Enhanced Content */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {title}
                  </h4>
                  {isRecent && (
                    <Badge
                      variant="outline"
                      className="gap-1 text-xs"
                      suppressHydrationWarning
                    >
                      <Zap className="h-3 w-3" />
                      Baru
                    </Badge>
                  )}
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>

              {/* Enhanced Metadata */}
              <div className="flex flex-col items-end gap-2">
                <Badge className={cn("text-xs", colors.badge)}>
                  {isAktivitasSiak
                    ? "SIAK"
                    : isPengaduan
                      ? "Pengaduan"
                      : "Dokumentasi"}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDateSafely()}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">Tanggal Aktivitas</p>
                      <p className="text-xs">{formatDateSafely()}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Enhanced Action Area */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Klik untuk detail</span>
              </div>
              <motion.div
                className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                whileHover={{ scale: 1.1 }}
              >
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
