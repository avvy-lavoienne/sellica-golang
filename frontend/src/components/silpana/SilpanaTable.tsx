"use client";

import { useState, memo, useCallback, useMemo, useRef } from "react";
import { SilpanaData, TicketStatus, PriorityLevel } from "@/types/silpana/silpana";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import { typo, textColors } from "@/lib/typography";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Archive,
  Ticket,
  AlertTriangle,
  ArrowUpCircle,
  ArrowRightCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Flag,
} from "lucide-react";

// Enhanced interface with enterprise-grade features
interface SilpanaTableProps {
  /** Silpana data array */
  rekapData: SilpanaData[];
  /** Total count of items */
  totalCount: number;
  /** Current page number */
  currentPage: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Search handler */
  onSearch: (query: string) => void;
  /** Refresh handler */
  onRefresh: () => void;
  /** Edit handler */
  onEdit: (data: SilpanaData) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** User role for permissions */
  userRole: string;
  /** Loading state */
  loading: boolean;
  /** Custom className */
  className?: string;
  /** Animation delay */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Error state */
  error?: boolean;
  /** Enable search functionality */
  enableSearch?: boolean;
  /** Enable filtering */
  enableFiltering?: boolean;
  /** Enable bulk operations */
  enableBulkActions?: boolean;
  /** Bulk action handlers */
  onBulkDelete?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  /** Export handler */
  onExport?: () => void;
  /** Status filter */
  statusFilter?: TicketStatus | null;
  /** Priority filter */
  priorityFilter?: PriorityLevel | null;
  /** Date range filter */
  dateRangeFilter?: { start: Date | null; end: Date | null };
  /** Status update handler */
  onStatusUpdate?: (id: string, status: TicketStatus) => void;
  /** Priority update handler */
  onPriorityUpdate?: (id: string, priority: PriorityLevel) => void;
  /** Ticket lookup handler */
  onTicketLookup?: (ticketCode: string) => void;
}

function SilpanaTable({
  rekapData,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onRefresh,
  onEdit,
  onDelete,
  userRole,
  loading,
  className,
  delay = 0.3,
  disableAnimations = false,
  error = false,
  enableSearch = true,
  enableFiltering = true,
  enableBulkActions = false,
  onBulkDelete,
  onBulkArchive,
  onExport,
  statusFilter,
  priorityFilter,
  dateRangeFilter,
  onStatusUpdate,
  onPriorityUpdate,
  onTicketLookup,
}: SilpanaTableProps) {
  // Enhanced state management for enterprise UX
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"nama" | "tanggal" | "creator" | "ticket_code" | "ticket_status" | "priority_level" | "last_updated">(
    "tanggal",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Refs for enhanced functionality
  const tableRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system for decorative effects (Flowbite patterns)
  const colorSchemes = useMemo(
    () => ({
      primary: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-700 dark:text-blue-300",
        accent: "text-blue-600 dark:text-blue-400",
        bgClass: "bg-blue-50 dark:bg-blue-900/20",
        borderClass: "border-blue-200 dark:border-blue-800",
        glowClass: "shadow-blue-500/20",
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

  // Ticket Status and Priority Utilities
  const getStatusConfig = useCallback((status?: TicketStatus) => {
    switch (status) {
      case TicketStatus.SUBMITTED:
        return {
          label: "Submitted",
          icon: ArrowUpCircle,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          darkColor: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
        };
      case TicketStatus.UNDER_REVIEW:
        return {
          label: "Under Review",
          icon: Eye,
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          darkColor: "dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
        };
      case TicketStatus.IN_PROGRESS:
        return {
          label: "In Progress",
          icon: ArrowRightCircle,
          color: "bg-purple-100 text-purple-800 border-purple-200",
          darkColor: "dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
        };
      case TicketStatus.PENDING_INFO:
        return {
          label: "Pending Info",
          icon: PauseCircle,
          color: "bg-orange-100 text-orange-800 border-orange-200",
          darkColor: "dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
        };
      case TicketStatus.ESCALATED:
        return {
          label: "Escalated",
          icon: TrendingUp,
          color: "bg-red-100 text-red-800 border-red-200",
          darkColor: "dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
        };
      case TicketStatus.RESOLVED:
        return {
          label: "Resolved",
          icon: CheckCircle2,
          color: "bg-green-100 text-green-800 border-green-200",
          darkColor: "dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
        };
      case TicketStatus.CLOSED:
        return {
          label: "Closed",
          icon: CheckCircle,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          darkColor: "dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600",
        };
      case TicketStatus.REJECTED:
        return {
          label: "Rejected",
          icon: XCircle,
          color: "bg-red-100 text-red-800 border-red-200",
          darkColor: "dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
        };
      default:
        return {
          label: "Unknown",
          icon: AlertCircle,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          darkColor: "dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600",
        };
    }
  }, []);

  const getPriorityConfig = useCallback((priority?: PriorityLevel) => {
    switch (priority) {
      case PriorityLevel.LOW:
        return {
          label: "Low",
          icon: ArrowRightCircle,
          color: "bg-gray-100 text-gray-700 border-gray-200",
          darkColor: "dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600",
        };
      case PriorityLevel.MEDIUM:
        return {
          label: "Medium",
          icon: Flag,
          color: "bg-blue-100 text-blue-700 border-blue-200",
          darkColor: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
        };
      case PriorityLevel.HIGH:
        return {
          label: "High",
          icon: AlertTriangle,
          color: "bg-orange-100 text-orange-700 border-orange-200",
          darkColor: "dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
        };
      case PriorityLevel.CRITICAL:
        return {
          label: "Critical",
          icon: AlertCircle,
          color: "bg-red-100 text-red-700 border-red-200",
          darkColor: "dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
        };
      default:
        return {
          label: "Normal",
          icon: Flag,
          color: "bg-gray-100 text-gray-700 border-gray-200",
          darkColor: "dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600",
        };
    }
  }, []);

  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  // Enhanced statistics
  const tableStats = useMemo(() => {
    const hasSelection = selectedItems.size > 0;
    const hasExpanded = expandedItems.size > 0;
    const hasSearch = searchTerm.trim().length > 0;
    return {
      hasSelection,
      hasExpanded,
      hasSearch,
      selectedCount: selectedItems.size,
      expandedCount: expandedItems.size,
    };
  }, [selectedItems.size, expandedItems.size, searchTerm]);

  // Enhanced handlers with enterprise features
  const toggleItemExpansion = useCallback(
    (id: string) => {
      const newExpandedItems = new Set(expandedItems);
      if (newExpandedItems.has(id)) {
        newExpandedItems.delete(id);
      } else {
        newExpandedItems.add(id);
      }
      setExpandedItems(newExpandedItems);
    },
    [expandedItems],
  );

  const toggleItemSelection = useCallback(
    (id: string) => {
      const newSelectedItems = new Set(selectedItems);
      if (newSelectedItems.has(id)) {
        newSelectedItems.delete(id);
      } else {
        newSelectedItems.add(id);
      }
      setSelectedItems(newSelectedItems);
    },
    [selectedItems],
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === rekapData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(rekapData.map((item) => item.id || "")));
    }
  }, [selectedItems.size, rekapData]);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchTerm(query);
      if (onSearch) {
        onSearch(query);
      }
    },
    [onSearch],
  );

  const handleBulkAction = useCallback(
    (action: "delete" | "archive") => {
      const selectedIds = Array.from(selectedItems);
      if (action === "delete" && onBulkDelete) {
        onBulkDelete(selectedIds);
      } else if (action === "archive" && onBulkArchive) {
        onBulkArchive(selectedIds);
      }
      setSelectedItems(new Set());
    },
    [selectedItems, onBulkDelete, onBulkArchive],
  );

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    
    // Use a consistent format to avoid hydration mismatches
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      
      // Use a consistent format that works on both server and client
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      
      return `${day.toString().padStart(2, '0')} ${months[month - 1]} ${year}`;
    } catch (error) {
      try {
        if (dateString.includes("-")) {
          const parts = dateString.split("-");
          const newDate =
            parts[0].length === 4
              ? new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
              : new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (!isNaN(newDate.getTime())) {
            const year = newDate.getFullYear();
            const month = newDate.getMonth() + 1;
            const day = newDate.getDate();
            
            const months = [
              "Januari", "Februari", "Maret", "April", "Mei", "Juni",
              "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];
            
            return `${day.toString().padStart(2, '0')} ${months[month - 1]} ${year}`;
          }
        }
        return dateString;
      } catch (e) {
        return dateString;
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      
      // Use a consistent format to avoid hydration mismatches
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      
      return `${day.toString().padStart(2, '0')} ${months[month - 1]} ${year}, ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      return dateString;
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

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: shouldAnimate ? i * 0.1 : 0,
        duration: shouldAnimate ? 0.3 : 0,
      },
    }),
  };

  if (loading) {
    return (
      <TooltipProvider>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800",
            className,
          )}
        >
          <div className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        ref={tableRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800",
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
              colorSchemes.primary.bgClass,
              "opacity-30",
            )}
          />
          <div
            className={cn(
              "absolute bottom-1/4 left-1/4 h-24 w-24 rounded-full blur-2xl",
              colorSchemes.blue.bgClass,
              "opacity-20",
            )}
          />
        </div>

        {/* Enhanced Header */}
        <motion.div
          variants={itemVariants}
          className="relative z-10 border-b border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <div className="flex flex-col gap-4 laptop:flex-row laptop:items-center laptop:justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 transition-all duration-200 dark:border-blue-800 dark:bg-blue-900/20",
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white laptop:text-2xl">
                  Data SILPANA
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Target className="h-3 w-3" />
                    {totalCount} Total
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    {rekapData.length} Showing
                  </Badge>
                  {tableStats.hasSelection && (
                    <Badge variant="default" className="gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      {tableStats.selectedCount} Selected
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loading}
                    className="rounded-lg border-gray-300 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-600 dark:hover:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", loading && "animate-spin")}
                    />
                    <span className="ml-2 hidden sm:inline">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh data</p>
                </TooltipContent>
              </Tooltip>

              {onExport && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onExport}
                      className="rounded-lg border-gray-300 transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 dark:border-gray-600 dark:hover:border-green-700 dark:hover:bg-green-900/20"
                    >
                      <Download className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Export</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export data</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Data Table */}
        <motion.div variants={itemVariants} className="relative z-10">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Desktop View */}
              <div className="hidden lg:block">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <tr>
                      {enableBulkActions && (
                        <th className="w-12 p-4 text-left">
                          <input
                            type="checkbox"
                            checked={
                              selectedItems.size === rekapData.length &&
                              rekapData.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600"
                          />
                        </th>
                      )}
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Ticket Code
                      </th>
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        NIK & Nama
                      </th>
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Pengaduan
                      </th>
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Priority
                      </th>
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Last Updated
                      </th>
                      <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Kontak
                      </th>
                      <th className="w-16 p-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <AnimatePresence>
                      {rekapData.map((item, index) => (
                        <motion.tr
                          key={item.id || index}
                          custom={index}
                          variants={rowVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: -20 }}
                          className={cn(
                            "transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50",
                            selectedItems.has(item.id || "") && "bg-blue-50 dark:bg-blue-900/20",
                          )}
                        >
                          {enableBulkActions && (
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id || "")}
                                onChange={() =>
                                  toggleItemSelection(item.id || "")
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600"
                              />
                            </td>
                          )}
                          
                          {/* Ticket Code Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Ticket className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <span className="font-mono font-medium text-gray-900 dark:text-white">
                                {item.ticket_code || "N/A"}
                              </span>
                              {item.ticket_code && onTicketLookup && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => onTicketLookup(item.ticket_code!)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>

                          {/* NIK & Nama Column */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {item.nik_pengaduan || "-"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.nama_pengaduan || "-"}
                              </p>
                            </div>
                          </td>

                          {/* Pengaduan Column */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1 mb-1">
                                {item.kategori_pengaduan && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.kategori_pengaduan}
                                  </Badge>
                                )}
                                {item.sub_kategori_pengaduan && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.sub_kategori_pengaduan}
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.alasan_pengaduan || "-"}
                              </p>
                              <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {item.deskripsi_pengaduan || "-"}
                              </p>
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="p-4">
                            {(() => {
                              const statusConfig = getStatusConfig(item.ticket_status);
                              const StatusIcon = statusConfig.icon;
                              return (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      statusConfig.color,
                                      statusConfig.darkColor,
                                      "gap-1 border"
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig.label}
                                  </Badge>
                                  {onStatusUpdate && userRole === "admin" && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <ChevronDown className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {Object.values(TicketStatus).map((status) => (
                                          <DropdownMenuItem
                                            key={status}
                                            onClick={() => onStatusUpdate(item.id || "", status)}
                                            className="gap-2"
                                          >
                                            {(() => {
                                              const config = getStatusConfig(status);
                                              const Icon = config.icon;
                                              return (
                                                <>
                                                  <Icon className="h-4 w-4" />
                                                  {config.label}
                                                </>
                                              );
                                            })()}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Priority Column */}
                          <td className="p-4">
                            {(() => {
                              const priorityConfig = getPriorityConfig(item.priority_level);
                              const PriorityIcon = priorityConfig.icon;
                              return (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      priorityConfig.color,
                                      priorityConfig.darkColor,
                                      "gap-1 border"
                                    )}
                                  >
                                    <PriorityIcon className="h-3 w-3" />
                                    {priorityConfig.label}
                                  </Badge>
                                  {onPriorityUpdate && userRole === "admin" && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <ChevronDown className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuLabel>Update Priority</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {Object.values(PriorityLevel).map((priority) => (
                                          <DropdownMenuItem
                                            key={priority}
                                            onClick={() => onPriorityUpdate(item.id || "", priority)}
                                            className="gap-2"
                                          >
                                            {(() => {
                                              const config = getPriorityConfig(priority);
                                              const Icon = config.icon;
                                              return (
                                                <>
                                                  <Icon className="h-4 w-4" />
                                                  {config.label}
                                                </>
                                              );
                                            })()}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              );
                            })()}
                          </td>

                          {/* Last Updated Column */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {formatDateTime(item.last_updated || item.created_at || "")}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Created: {formatDateTime(item.created_at || "")}
                              </p>
                            </div>
                          </td>

                          {/* Kontak Column */}
                          <td className="p-4">
                            <div className="space-y-1.5">
                              {/* Phone */}
                              <div className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {item.nomor_telepon || "-"}
                                </span>
                              </div>
                              {/* Email */}
                              {item.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                    {item.email}
                                  </span>
                                </div>
                              )}
                              {/* Alamat */}
                              {item.alamat && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {item.alamat}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleItemExpansion(item.id || "")
                                  }
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {userRole === "admin" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => onEdit(item)}
                                      className="gap-2"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onDelete(item.id || "")}
                                      className="gap-2 text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="block lg:hidden">
                <div className="space-y-4 p-4">
                  <AnimatePresence>
                    {rekapData.map((item, index) => (
                      <motion.div
                        key={item.id || index}
                        custom={index}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800",
                          selectedItems.has(item.id || "") && "ring-2 ring-blue-500/20 dark:ring-blue-400/20",
                        )}
                      >
                        <div className="space-y-3">
                          {/* Header with Ticket Code */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              {item.ticket_code && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Ticket className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                                    {item.ticket_code}
                                  </span>
                                  {onTicketLookup && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => onTicketLookup(item.ticket_code!)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {item.nik_pengaduan || "-"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.nama_pengaduan || "-"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {/* Status Badge */}
                              {(() => {
                                const statusConfig = getStatusConfig(item.ticket_status);
                                const StatusIcon = statusConfig.icon;
                                return (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      statusConfig.color,
                                      statusConfig.darkColor,
                                      "gap-1 border"
                                    )}
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig.label}
                                  </Badge>
                                );
                              })()}
                              
                              {/* Priority Badge */}
                              {(() => {
                                const priorityConfig = getPriorityConfig(item.priority_level);
                                const PriorityIcon = priorityConfig.icon;
                                return (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      priorityConfig.color,
                                      priorityConfig.darkColor,
                                      "gap-1 border"
                                    )}
                                  >
                                    <PriorityIcon className="h-3 w-3" />
                                    {priorityConfig.label}
                                  </Badge>
                                );
                              })()}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleItemExpansion(item.id || "")
                                    }
                                    className="gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {userRole === "admin" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => onEdit(item)}
                                        className="gap-2"
                                      >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => onDelete(item.id || "")}
                                        className="gap-2 text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="space-y-2">
                            <div>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {item.kategori_pengaduan && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.kategori_pengaduan}
                                  </Badge>
                                )}
                                {item.sub_kategori_pengaduan && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.sub_kategori_pengaduan}
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.alasan_pengaduan || "-"}
                              </p>
                              <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {item.deskripsi_pengaduan || "-"}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {item.nomor_telepon || "-"}
                              </div>
                              {item.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[120px]">{item.email}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTime(item.last_updated || item.created_at || "")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.tanggal_pengaduan)}
                              </div>
                            </div>
                            {item.alamat && (
                              <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{item.alamat}</span>
                              </div>
                            )}
                          </div>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedItems.has(item.id || "") && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-gray-200 pt-3 dark:border-gray-700"
                              >
                                <div className="space-y-2">
                                  {/* Ticket Information */}
                                  {item.ticket_code && (
                                    <div>
                                      <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                        Ticket Code:
                                      </h5>
                                      <p className="font-mono text-gray-900 dark:text-white">
                                        {item.ticket_code}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Status Updates for Admin */}
                                  {userRole === "admin" && (
                                    <div className="grid grid-cols-2 gap-2">
                                      {onStatusUpdate && (
                                        <div>
                                          <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                            Update Status:
                                          </h5>
                                          <select
                                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={item.ticket_status || TicketStatus.SUBMITTED}
                                            onChange={(e) => onStatusUpdate(item.id || "", e.target.value as TicketStatus)}
                                          >
                                            {Object.values(TicketStatus).map((status) => (
                                              <option key={status} value={status}>
                                                {getStatusConfig(status).label}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                      
                                      {onPriorityUpdate && (
                                        <div>
                                          <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                            Update Priority:
                                          </h5>
                                          <select
                                            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            value={item.priority_level || PriorityLevel.MEDIUM}
                                            onChange={(e) => onPriorityUpdate(item.id || "", e.target.value as PriorityLevel)}
                                          >
                                            {Object.values(PriorityLevel).map((priority) => (
                                              <option key={priority} value={priority}>
                                                {getPriorityConfig(priority).label}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                      Full Description:
                                    </h5>
                                    <p className="text-gray-900 dark:text-white">
                                      {item.deskripsi_pengaduan || "-"}
                                    </p>
                                  </div>
                                  {item.tindak_lanjut_pengaduan && (
                                    <div>
                                      <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                        Follow-up:
                                      </h5>
                                      <p className="text-gray-900 dark:text-white">
                                        {item.tindak_lanjut_pengaduan}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Ticket Metadata */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                        Created:
                                      </h5>
                                      <p className="text-gray-900 dark:text-white">
                                        {formatDateTime(item.created_at || "")}
                                      </p>
                                    </div>
                                    {item.last_updated && (
                                      <div>
                                        <h5 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
                                          Last Updated:
                                        </h5>
                                        <p className="text-gray-900 dark:text-white">
                                          {formatDateTime(item.last_updated)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <motion.div
            variants={itemVariants}
            className="relative z-10 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(currentPage * rowsPerPage, totalCount)} of{" "}
                  {totalCount} entries
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 rounded-lg border-gray-300 p-0 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>First page</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 rounded-lg border-gray-300 p-0 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Previous page</p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(pageNum)}
                        className={cn(
                          "h-8 w-8 rounded-lg p-0",
                          currentPage === pageNum
                            ? "bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                            : "border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                        )}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 rounded-lg border-gray-300 p-0 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Next page</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 rounded-lg border-gray-300 p-0 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last page</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

export default memo(SilpanaTable);