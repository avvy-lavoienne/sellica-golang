"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import type { DuplicateOperatorData } from "@/types/data-rekam/duplicate-operator";
import type { UpdateDuplicateOperatorRequest } from "@/lib/api/types/duplicate-operator";
import TableSkeleton from "@/components/dashboard/data-rekam/duplicate-operator/TableSkeleton";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  FileText,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/dashboard/data-rekam/duplicate-operator/EmptyState";

// Enhanced interface with enterprise-grade features
interface DuplicateOperatorTableProps {
  /** Table data array */
  rekapData: DuplicateOperatorData[];
  /** Total count of records */
  totalCount: number;
  /** Current page number */
  currentPage: number;
  /** Number of items per page */
  pageSize: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Search handler with optional date filters */
  onSearch: (query: string, statusFilter?: string, startDate?: string, endDate?: string) => void;
  /** Refresh handler (full refresh with reset) */
  onRefresh: () => void;
  /** Data refresh handler (preserves pagination/filters) */
  onDataRefresh?: () => void;
  /** Edit handler */
  onEdit: (data: DuplicateOperatorData) => void;
  /** Update handler for inline updates */
  onUpdate?: (id: string, data: UpdateDuplicateOperatorRequest) => Promise<any>;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** User role for permissions */
  userRole: string;
  /** Loading state */
  loading: boolean;
  /** Custom className for styling */
  className?: string;
  /** Animation delay for staggered animations */
  delay?: number;
  /** Disable animations for accessibility */
  disableAnimations?: boolean;
  /** Custom aria-label for accessibility */
  "aria-label"?: string;
}

const DuplicateOperatorTable: React.FC<DuplicateOperatorTableProps> = ({
  rekapData,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSearch,
  onRefresh,
  onDataRefresh,
  onEdit,
  onUpdate,
  onDelete,
  userRole,
  loading,
  className,
  delay = 0,
  disableAnimations = false,
  "aria-label": ariaLabel,
}) => {
  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editedDates, setEditedDates] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>({
    key: "tanggal_pengajuan",
    direction: "desc"
  });

  // ✅ Tracking refs for defensive checks
  const previousSearchRef = useRef<string>("");
  const previousStatusRef = useRef<string>("all");
  const previousStartDateRef = useRef<string>("");
  const previousEndDateRef = useRef<string>("");
  const tableRef = useRef<HTMLDivElement>(null);

  // Theme and accessibility
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !disableAnimations && !prefersReducedMotion;

  // Enhanced color system consistent with other components
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
    }),
    [],
  );

  // Store onSearch callback in a ref to avoid recreating effects
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // ✅ COMBINED FILTERS STATE - Debounce all filters together to avoid split requests
  const combinedFilters = useMemo(() => ({
    query: searchQuery.trim(),
    status: statusFilter,
    startDate: startDate,
    endDate: endDate,
  }), [searchQuery, statusFilter, startDate, endDate]);

  const debouncedFilters = useDebounce(combinedFilters, 500);

  // ✅ UNIFIED SEARCH & FILTER EFFECT - Fire once with all params together
  useEffect(() => {
    console.log('[Table Effect] Debounced filters received:', debouncedFilters);
    
    // VALIDATION: If user started date filtering (has startDate), require BOTH dates
    // This prevents split requests like date_from without date_to
    const hasStartDate = debouncedFilters.startDate.trim().length > 0;
    const hasEndDate = debouncedFilters.endDate.trim().length > 0;
    
    // If user entered start date, wait for end date (and vice versa)
    if (hasStartDate && !hasEndDate) {
      console.log('[Table Effect] Waiting for end date input...');
      return; // Don't fire search yet
    }
    if (hasEndDate && !hasStartDate) {
      console.log('[Table Effect] Waiting for start date input...');
      return; // Don't fire search yet
    }
    
    // DEFENSIVE CHECK: Only call onSearch if filters have actually changed
    const hasChanged = 
      debouncedFilters.query !== previousSearchRef.current ||
      debouncedFilters.status !== previousStatusRef.current ||
      debouncedFilters.startDate !== previousStartDateRef.current ||
      debouncedFilters.endDate !== previousEndDateRef.current;

    if (hasChanged) {
      console.log('[Table Effect] Filters changed, calling onSearch with:', debouncedFilters);
      // Pass all filters together in one API call
      onSearchRef.current(
        debouncedFilters.query,
        debouncedFilters.status,
        debouncedFilters.startDate,
        debouncedFilters.endDate
      );
      previousSearchRef.current = debouncedFilters.query;
      previousStatusRef.current = debouncedFilters.status;
      previousStartDateRef.current = debouncedFilters.startDate;
      previousEndDateRef.current = debouncedFilters.endDate;
    }
  }, [debouncedFilters]);

  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const handleToggleChange = async (id: string, currentStatus: boolean) => {
    if (!["admin", "superuser"].includes(userRole)) {
      toast.error("Hanya admin atau superuser yang dapat mengubah status.");
      return;
    }

    try {
      console.log("[DuplicateOperatorTable] handleToggleChange called:", { id, currentStatus });
      const newStatus = !currentStatus;
      if (onUpdate) {
        console.log("[DuplicateOperatorTable] Calling onUpdate with:", { id, newStatus });
        await onUpdate(id, { is_ready_to_record: newStatus });
      } else {
        console.error("onUpdate handler is not provided");
        toast.error("Gagal memperbarui status: fungsi tidak tersedia.");
        return;
      }

      toast.success("Status berhasil diubah!");
      // Use onDataRefresh to preserve pagination/filters, fallback to onRefresh
      if (onDataRefresh) {
        onDataRefresh();
      } else {
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Gagal mengubah status. Silakan coba lagi.");
    }
  };

  const handleDateChange = (id: string, value: string) => {
    setEditedDates((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveDate = async (id: string) => {
    if (!["admin", "superuser"].includes(userRole)) {
      toast.error("Hanya admin atau superuser yang dapat mengubah tanggal.");
      return;
    }

    const newDate = editedDates[id];
    if (!newDate) {
      toast.error("Tanggal tidak boleh kosong!");
      return;
    }

    setSaving((prev) => ({ ...prev, [id]: true }));

    try {
      console.log("[DuplicateOperatorTable] handleSaveDate called:", { id, newDate });
      if (onUpdate) {
        console.log("[DuplicateOperatorTable] Calling onUpdate with:", { id, newDate });
        await onUpdate(id, { estimasi_tanggal_perekaman: newDate });
      } else {
        console.error("onUpdate handler is not provided");
        toast.error("Gagal menyimpan tanggal: fungsi tidak tersedia.");
        setSaving((prev) => ({ ...prev, [id]: false }));
        return;
      }

      toast.success("Tanggal berhasil disimpan!");
      // Use onDataRefresh to preserve pagination/filters, fallback to onRefresh
      if (onDataRefresh) {
        onDataRefresh();
      } else {
        onRefresh();
      }
      setEditedDates((prev) => {
        const newDates = { ...prev };
        delete newDates[id];
        return newDates;
      });
    } catch (error: any) {
      console.error("Error saving date:", error);
      toast.error(error.message || "Gagal menyimpan tanggal. Silakan coba lagi.");
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toString() !== "Invalid Date"
      ? date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Tanggal tidak valid";
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return rekapData;

    return [...rekapData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "tanggal_pengajuan":
          aValue = new Date(a.tanggal_pengajuan).getTime();
          bValue = new Date(b.tanggal_pengajuan).getTime();
          break;
        case "tanggal_perekaman":
          aValue = new Date(a.tanggal_perekaman).getTime();
          bValue = new Date(b.tanggal_perekaman).getTime();
          break;
        case "nama_duplicate":
          aValue = a.nama_duplicate.toLowerCase();
          bValue = b.nama_duplicate.toLowerCase();
          break;
        case "nama_operator":
          aValue = a.nama_operator.toLowerCase();
          bValue = b.nama_operator.toLowerCase();
          break;
        case "nik_duplicate":
          aValue = a.nik_duplicate;
          bValue = b.nik_duplicate;
          break;
        case "nik_operator":
          aValue = a.nik_operator;
          bValue = b.nik_operator;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [rekapData, sortConfig]);

  // Sort handler
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        // Toggle direction if same key
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc"
        };
      } else {
        // New key, default to asc except for tanggal_pengajuan which defaults to desc
        return {
          key,
          direction: key === "tanggal_pengajuan" ? "desc" : "asc"
        };
      }
    });
  }, []);

  // Sort indicator component
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) {
      return <ChevronDown className="ml-1 h-4 w-4 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  // Accessibility attributes
  const accessibilityProps = {
    role: "table",
    "aria-label": ariaLabel || "Tabel data duplicate operator",
    "aria-describedby": "table-description",
  };

  if (loading) {
    return <TableSkeleton />;
  }

  // Show empty state when there's no data and not loading
  if (rekapData.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <EmptyState onAddNew={() => {}} />
      </div>
    );
  }

  // Animation variants for enterprise-grade micro-interactions
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 16,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.4 : 0,
        ease: "easeOut" as const,
        delay: delay,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 8,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: "easeOut" as const,
      },
    },
  };

  const rowVariants = {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: shouldAnimate ? 0.3 : 0,
        ease: "easeOut" as const,
      },
    },
    hover: {
      scale: 1.01,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
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
        {...accessibilityProps}
      >
        {/* Enhanced Filters Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Filter & Pencarian
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {totalCount} total records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari data (NIK, Nama, dll.)..."
                  className="block w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  aria-label="Cari data di tabel"
                  disabled={loading}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Hapus pencarian"
                    disabled={loading}
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Date Filters and Status Filter */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Tanggal Mulai
                  </Label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                    className={cn(
                      "block w-full px-3 py-2.5 text-sm",
                      "border border-gray-200 rounded-xl",
                      "bg-white text-gray-900",
                      "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                      "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
                      "dark:focus:border-primary/50 dark:focus:ring-primary/20",
                      "transition-all duration-200",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Tanggal mulai filter"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Tanggal Selesai
                  </Label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                    className={cn(
                      "block w-full px-3 py-2.5 text-sm",
                      "border border-gray-200 rounded-xl",
                      "bg-white text-gray-900",
                      "focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                      "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
                      "dark:focus:border-primary/50 dark:focus:ring-primary/20",
                      "transition-all duration-200",
                      loading && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Tanggal selesai filter"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Status Filter
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    disabled={loading}
                    className="block w-full px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">Semua Status</option>
                    <option value="completed">Selesai</option>
                    <option value="pending">Belum Selesai</option>
                  </select>
                </div>

                <div className="flex items-end space-x-2">
                  <button
                    onClick={() => {
                      // Reset all filters to initial state
                      setSearchQuery("");
                      setStatusFilter("all");
                      setStartDate("");
                      setEndDate("");
                      toast.success("Filter telah direset");
                    }}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                  <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-blue-700 border border-transparent rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Table Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-semibold">
                    Data Duplicate Operator
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    Halaman {currentPage}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {rekapData.length} dari {totalCount}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-lg border border-border/50">
                <div className="overflow-x-auto" ref={tableRef}>
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">No</th>
                        <th scope="col" className="px-6 py-3">
                          <button
                            onClick={() => handleSort("tanggal_pengajuan")}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            Tanggal Pengajuan
                            <SortIndicator columnKey="tanggal_pengajuan" />
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-3">
                          <button
                            onClick={() => handleSort("nama_duplicate")}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            NIK / Nama Duplikat
                            <SortIndicator columnKey="nama_duplicate" />
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-3">
                          <button
                            onClick={() => handleSort("nama_operator")}
                            className="flex items-center hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            NIK / Nama Operator
                            <SortIndicator columnKey="nama_operator" />
                          </button>
                        </th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center space-y-3">
                              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Tidak ada data yang ditemukan
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Coba ubah filter atau kata kunci pencarian
                              </p>
                              <button
                                onClick={() => {
                                  // Reset all filters and refresh
                                  setSearchQuery("");
                                  setStatusFilter("all");
                                  setStartDate("");
                                  setEndDate("");
                                  onRefresh();
                                  toast.success("Filter telah direset");
                                }}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-700 border border-transparent rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reset Filters
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                          sortedData.map((item, index) => {
                            const rowNumber = (currentPage - 1) * pageSize + index + 1;
                            const isExpanded = expandedRow === item.id;

                            return (
                              <React.Fragment key={item.id}>
                                <motion.tr
                                  variants={rowVariants}
                                  initial="hidden"
                                  animate="visible"
                                  whileHover="hover"
                                  className="group transition-all duration-200 hover:bg-muted/30"
                                >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {rowNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(item.tanggal_pengajuan)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{item.nama_duplicate || "-"}</span>
                            </div>
                            <div className="pl-6 text-xs text-gray-500 dark:text-gray-400">
                              NIK: {item.nik_duplicate || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{item.nama_operator || "-"}</span>
                            </div>
                            <div className="pl-6 text-xs text-gray-500 dark:text-gray-400">
                              NIK: {item.nik_operator || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.is_ready_to_record
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}>
                            {item.is_ready_to_record ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {item.is_ready_to_record ? "Selesai" : "Belum Selesai"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-700 dark:hover:text-gray-300"
                              title={isExpanded ? "Sembunyikan detail" : "Lihat detail"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              onClick={() => onEdit(item)}
                              disabled={userRole !== "admin"}
                              className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit data"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => onDelete(item.id)}
                              disabled={userRole !== "admin"}
                              className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus data"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                                </motion.tr>

                              {/* Expanded Row */}
                              {isExpanded && (
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                  <td colSpan={6} className="px-6 py-6 bg-gray-50 dark:bg-gray-700/50">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                      {/* Data Duplikat */}
                                      <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Data Duplikat
                                          </h4>
                                        </div>
                                        <div className="space-y-2 pl-6">
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NIK:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{item.nik_duplicate || "-"}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nama:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{item.nama_duplicate || "-"}</span>
                                          </div>
                                        </div>
                                      </div>
       
                                      {/* Data Operator */}
                                      <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Data Operator
                                          </h4>
                                        </div>
                                        <div className="space-y-2 pl-6">
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NIK:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{item.nik_operator || "-"}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nama:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{item.nama_operator || "-"}</span>
                                          </div>
                                        </div>
                                      </div>
       
                                      {/* Detail Pengajuan */}
                                      <div className="space-y-3">
                                        <div className="flex items-center space-x-2">
                                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Detail Pengajuan
                                          </h4>
                                        </div>
                                        <div className="space-y-2 pl-6">
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NIK Pengaju:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{item.nik_pengaju || "-"}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nama Pengaju:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{item.nama_pengaju || "-"}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal Perekaman:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{formatDate(item.tanggal_perekaman)}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal Pengajuan:</span>
                                            <span className="text-xs text-gray-900 dark:text-white">{formatDate(item.tanggal_pengajuan)}</span>
                                          </div>
       
                                          {/* Estimasi Tanggal Perekaman */}
                                          <div className="space-y-2">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Estimasi Perekaman:</span>
                                            {["admin", "superuser"].includes(userRole) ? (
                                              <div className="flex items-center space-x-2">
                                                <input
                                                  type="date"
                                                  value={editedDates[item.id] || item.estimasi_tanggal_perekaman || ""}
                                                  onChange={(e) => handleDateChange(item.id, e.target.value)}
                                                  className="h-8 text-xs px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                                  disabled={saving[item.id]}
                                                />
                                                <button
                                                  onClick={() => handleSaveDate(item.id)}
                                                  disabled={saving[item.id] || !editedDates[item.id]}
                                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-700 border border-transparent rounded hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                                                >
                                                  {saving[item.id] ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                  ) : (
                                                    <Save className="w-3 h-3" />
                                                  )}
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-gray-900 dark:text-white">
                                                {formatDate(item.estimasi_tanggal_perekaman || undefined)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
       
                                    {/* Status Toggle for Admin */}
                                    {["admin", "superuser"].includes(userRole) && (
                                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 pt-4">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Perekaman:</span>
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            item.is_ready_to_record
                                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                          }`}>
                                            {item.is_ready_to_record ? "Selesai" : "Belum Selesai"}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleToggleChange(item.id, item.is_ready_to_record)}
                                          className={`inline-flex items-center px-4 py-2 text-sm font-medium border border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            item.is_ready_to_record
                                              ? "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                              : "text-white bg-blue-700 hover:bg-blue-800"
                                          }`}
                                        >
                                          {item.is_ready_to_record ? "Tandai Belum Selesai" : "Tandai Selesai"}
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            );
                          })
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Pagination */}
        {Math.ceil(totalCount / pageSize) > 0 && (
          <div className="flex justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-6 py-4">
                <nav className="flex items-center justify-between" aria-label="Pagination">
                  <div className="text-sm text-gray-700 dark:text-gray-400">
                    Halaman <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> dari{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">{Math.ceil(totalCount / pageSize)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1).map((page) => {
                      const totalPages = Math.ceil(totalCount / pageSize);
                      const shouldShow = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1) || (currentPage === 1 && page <= 3) || (currentPage === totalPages && page >= totalPages - 2);

                      if (!shouldShow && page === currentPage - 2) {
                        return <span key="ellipsis-prev" className="px-2 py-1 text-gray-400" aria-hidden="true">...</span>;
                      }

                      if (!shouldShow && page === currentPage + 2) {
                        return <span key="ellipsis-next" className="px-2 py-1 text-gray-400" aria-hidden="true">...</span>;
                      }

                      if (!shouldShow) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === page
                              ? "text-white bg-blue-700 border border-blue-700"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                          }`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => onPageChange(Math.min(Math.ceil(totalCount / pageSize), currentPage + 1))}
                      disabled={currentPage === Math.ceil(totalCount / pageSize)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default DuplicateOperatorTable;