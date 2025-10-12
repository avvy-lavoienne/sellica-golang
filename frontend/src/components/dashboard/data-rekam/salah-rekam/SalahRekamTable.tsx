"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/conn/utils";
import type { SalahRekamData } from "@/types/data-rekam/salah-rekam";
import TableSkeleton from "@/components/dashboard/data-rekam/salah-rekam/TableSkeleton";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { id as idLocale } from "date-fns/locale";
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
  Camera,
  Fingerprint,
  UserX,
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

// Enhanced interface with enterprise-grade features
interface SalahRekamTableProps {
  /** Table data array */
  rekapData: SalahRekamData[];
  /** Total count of records */
  totalCount: number;
  /** Current page number */
  currentPage: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Search handler */
  onSearch: (query: string, statusFilter?: string) => void;
  /** Refresh handler (full refresh with reset) */
  onRefresh: () => void;
  /** Data refresh handler (preserves pagination/filters) */
  onDataRefresh?: () => void;
  /** Edit handler */
  onEdit: (data: SalahRekamData) => void;
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

const SalahRekamTable: React.FC<SalahRekamTableProps> = ({
  rekapData,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onRefresh,
  onDataRefresh,
  onEdit,
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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
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

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);

  useEffect(() => {
    if (searchQuery === "" && (!startDate || !endDate)) {
      onSearch("", statusFilter);
      return;
    }

    const timeout = setTimeout(() => {
      onSearch(debouncedSearchQuery, statusFilter);
    }, 500);
    return () => clearTimeout(timeout);
  }, [
    debouncedSearchQuery,
    statusFilter,
    onSearch,
    endDate,
    searchQuery,
    startDate,
  ]);

  const handleDateFilter = useCallback(() => {
    if (debouncedStartDate && debouncedEndDate) {
      try {
        if (
          !(
            debouncedStartDate instanceof Date &&
            !isNaN(debouncedStartDate.getTime())
          ) ||
          !(
            debouncedEndDate instanceof Date &&
            !isNaN(debouncedEndDate.getTime())
          )
        ) {
          return;
        }

        const formattedStartDate = new Date(debouncedStartDate);
        formattedStartDate.setUTCHours(0, 0, 0, 0);

        const formattedEndDate = new Date(debouncedEndDate);
        formattedEndDate.setUTCHours(23, 59, 59, 999);

        const startYear = formattedStartDate.getUTCFullYear();
        const endYear = formattedEndDate.getUTCFullYear();

        if (
          startYear < 1000 ||
          startYear > 9999 ||
          endYear < 1000 ||
          endYear > 9999
        ) {
          return;
        }

        const startISO = formattedStartDate.toISOString();
        const endISO = formattedEndDate.toISOString();

        onSearch(
          `created_at >= '${startISO}' AND created_at <= '${endISO}'`,
          statusFilter,
        );
      } catch (error) {
        onSearch("", statusFilter);
      }
    } else {
      onSearch("", statusFilter);
    }
  }, [debouncedStartDate, debouncedEndDate, statusFilter, onSearch]);

  useEffect(() => {
    handleDateFilter();
  }, [debouncedStartDate, debouncedEndDate, handleDateFilter]);

  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const handleToggleChange = async (id: string, currentStatus: boolean) => {
    if (!["admin", "superuser"].includes(userRole)) {
      toast.error("Hanya admin atau superuser yang dapat mengubah status.");
      return;
    }

    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("salah_rekam")
        .update({ is_ready_to_record: newStatus })
        .eq("id", id);

      if (error) {
        throw new Error(`Gagal mengubah status: ${error.message}`);
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
      const { error } = await supabase
        .from("salah_rekam")
        .update({ estimasi_tanggal_perekaman: newDate })
        .eq("id", id);

      if (error) throw new Error(`Gagal menyimpan tanggal: ${error.message}`);

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
      toast.error(
        error.message || "Gagal menyimpan tanggal. Silakan coba lagi.",
      );
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

  const handleEdit = (data: SalahRekamData) => {
    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat mengedit data.");
      return;
    }
    onEdit(data);
  };

  const handleDelete = (id: string) => {
    if (userRole !== "admin") {
      toast.error("Hanya admin yang dapat menghapus data.");
      return;
    }
    onDelete(id);
  };

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

  // Accessibility attributes
  const accessibilityProps = {
    role: "table",
    "aria-label": ariaLabel || "Tabel data salah rekam",
    "aria-describedby": "table-description",
  };

  if (loading) {
    return <TableSkeleton />;
  }

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
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari data (NIK, Nama, dll.)..."
                  className="pl-10 transition-all duration-200"
                  aria-label="Cari data di tabel"
                  disabled={loading}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                    aria-label="Hapus pencarian"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Date Filters and Status Filter */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={idLocale}
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tanggal Mulai</Label>
                    <DatePicker
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      disabled={loading}
                      slotProps={{
                        textField: {
                          className: cn(
                            "w-full rounded-xl border transition-all duration-200",
                            // Light mode styles
                            "border-gray-200 bg-white text-gray-900",
                            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
                            // Dark mode styles
                            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
                            "dark:focus-within:border-primary/50 dark:focus-within:ring-primary/20",
                            // Disabled state
                            loading && "opacity-50 cursor-not-allowed",
                          ),
                          size: "small",
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "transparent",
                              "& fieldset": { borderColor: "transparent" },
                              "&:hover fieldset": {
                                borderColor: "transparent",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "transparent",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Tanggal Selesai
                    </Label>
                    <DatePicker
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      disabled={loading}
                      slotProps={{
                        textField: {
                          className: cn(
                            "w-full rounded-xl border transition-all duration-200",
                            // Light mode styles
                            "border-gray-200 bg-white text-gray-900",
                            "focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20",
                            // Dark mode styles
                            "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
                            "dark:focus-within:border-primary/50 dark:focus-within:ring-primary/20",
                            // Disabled state
                            loading && "opacity-50 cursor-not-allowed",
                          ),
                          size: "small",
                          sx: {
                            "& .MuiOutlinedInput-root": {
                              backgroundColor: "transparent",
                              "& fieldset": { borderColor: "transparent" },
                              "&:hover fieldset": {
                                borderColor: "transparent",
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: "transparent",
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </LocalizationProvider>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status Filter</Label>
                  <FormControl size="small" className="w-full">
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
                      sx={{
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "transparent",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "transparent",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "transparent",
                        },
                      }}
                    >
                      <MenuItem value="all">Semua Status</MenuItem>
                      <MenuItem value="completed">Selesai</MenuItem>
                      <MenuItem value="pending">Belum Selesai</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={onRefresh}
                    disabled={loading}
                    className="w-full transition-all duration-200"
                    size="sm"
                  >
                    {loading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Refresh
                  </Button>
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
                    Data Salah Rekam
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
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/30">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          No
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          Tanggal Pengajuan
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          NIK / Nama Salah Rekam
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          NIK / Nama Pemilik Biometric
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          NIK / Nama Pemilik Foto
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      <AnimatePresence mode="wait">
                        {rekapData.length === 0 ? (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td
                              colSpan={7}
                              className="px-4 py-12 text-center text-muted-foreground"
                            >
                              <div className="flex flex-col items-center space-y-3">
                                <FileText className="h-12 w-12 text-muted-foreground/50" />
                                <p className="text-sm font-medium">
                                  Tidak ada data yang ditemukan
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Coba ubah filter atau kata kunci pencarian
                                </p>
                              </div>
                            </td>
                          </motion.tr>
                        ) : (
                          rekapData.map((item, index) => {
                            const rowNumber = (currentPage - 1) * 5 + index + 1;
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
                                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-foreground">
                                    <div className="flex items-center space-x-2">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {rowNumber}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-sm text-foreground">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>{formatDate(item.created_at)}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-foreground">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <UserX className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          {item.nama_salah_rekam || "-"}
                                        </span>
                                      </div>
                                      <div className="pl-6 text-xs text-muted-foreground">
                                        NIK: {item.nik_salah_rekam || "-"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-foreground">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <Fingerprint className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          {item.nama_pemilik_biometric || "-"}
                                        </span>
                                      </div>
                                      <div className="pl-6 text-xs text-muted-foreground">
                                        NIK: {item.nik_pemilik_biometric || "-"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-sm text-foreground">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                          {item.nama_pemilik_foto || "-"}
                                        </span>
                                      </div>
                                      <div className="pl-6 text-xs text-muted-foreground">
                                        NIK: {item.nik_pemilik_foto || "-"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-sm">
                                    <Badge
                                      variant={
                                        item.is_ready_to_record
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={cn(
                                        "inline-flex items-center space-x-1 transition-all duration-200",
                                        item.is_ready_to_record
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                                      )}
                                    >
                                      {item.is_ready_to_record ? (
                                        <CheckCircle2 className="h-3 w-3" />
                                      ) : (
                                        <Clock className="h-3 w-3" />
                                      )}
                                      <span>
                                        {item.is_ready_to_record
                                          ? "Selesai"
                                          : "Belum Selesai"}
                                      </span>
                                    </Badge>
                                  </td>
                                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm">
                                    <div className="flex justify-end space-x-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              setExpandedRow(
                                                isExpanded ? null : item.id,
                                              )
                                            }
                                            className="h-8 w-8 p-0 transition-all duration-200"
                                            aria-label={
                                              isExpanded
                                                ? "Sembunyikan detail"
                                                : "Lihat detail"
                                            }
                                          >
                                            {isExpanded ? (
                                              <ChevronUp className="h-4 w-4" />
                                            ) : (
                                              <ChevronDown className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {isExpanded
                                            ? "Sembunyikan detail"
                                            : "Lihat detail"}
                                        </TooltipContent>
                                      </Tooltip>

                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(item)}
                                            disabled={userRole !== "admin"}
                                            className="h-8 w-8 p-0 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                                            aria-label="Edit data"
                                          >
                                            <Edit3 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Edit data
                                        </TooltipContent>
                                      </Tooltip>

                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDelete(item.id)
                                            }
                                            disabled={userRole !== "admin"}
                                            className="h-8 w-8 p-0 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                            aria-label="Hapus data"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Hapus data
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </td>
                                </motion.tr>

                                {/* Enhanced Expanded Row */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.tr
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{
                                        duration: shouldAnimate ? 0.3 : 0,
                                      }}
                                    >
                                      <td
                                        colSpan={7}
                                        className="border-t border-border/50 bg-muted/20 px-4 py-6"
                                      >
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                          {/* Data Salah Rekam */}
                                          <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                              <UserX className="h-4 w-4 text-primary" />
                                              <h4 className="text-sm font-semibold text-foreground">
                                                Data Salah Rekam
                                              </h4>
                                            </div>
                                            <div className="space-y-2 pl-6">
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  NIK:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nik_salah_rekam || "-"}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  Nama:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nama_salah_rekam || "-"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Data Pemilik Biometric */}
                                          <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                              <Fingerprint className="h-4 w-4 text-primary" />
                                              <h4 className="text-sm font-semibold text-foreground">
                                                Data Pemilik Biometric
                                              </h4>
                                            </div>
                                            <div className="space-y-2 pl-6">
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  NIK:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nik_pemilik_biometric ||
                                                    "-"}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  Nama:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nama_pemilik_biometric ||
                                                    "-"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Data Pemilik Foto */}
                                          <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                              <Camera className="h-4 w-4 text-primary" />
                                              <h4 className="text-sm font-semibold text-foreground">
                                                Data Pemilik Foto
                                              </h4>
                                            </div>
                                            <div className="space-y-2 pl-6">
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  NIK:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nik_pemilik_foto || "-"}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  Nama:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nama_pemilik_foto ||
                                                    "-"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Additional Details */}
                                        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                          {/* Detail Petugas */}
                                          <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                              <Users className="h-4 w-4 text-primary" />
                                              <h4 className="text-sm font-semibold text-foreground">
                                                Detail Petugas
                                              </h4>
                                            </div>
                                            <div className="space-y-2 pl-6">
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  NIK Petugas Rekam:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nik_petugas_rekam ||
                                                    "-"}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  Nama Petugas Rekam:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nama_petugas_rekam ||
                                                    "-"}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  NIK Pengaju:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nik_pengaju || "-"}
                                                </span>
                                              </div>
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  Nama Pengaju:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {item.nama_pengaju || "-"}
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Detail Tanggal */}
                                          <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                              <FileText className="h-4 w-4 text-primary" />
                                              <h4 className="text-sm font-semibold text-foreground">
                                                Detail Tanggal
                                              </h4>
                                            </div>
                                            <div className="space-y-2 pl-6">
                                              <div className="flex justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  Tanggal Perekaman:
                                                </span>
                                                <span className="text-xs text-foreground">
                                                  {formatDate(
                                                    item.tanggal_perekaman,
                                                  )}
                                                </span>
                                              </div>

                                              {/* Estimasi Tanggal Perekaman */}
                                              <div className="space-y-2">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                  Estimasi Perekaman:
                                                </span>
                                                {[
                                                  "admin",
                                                  "superuser",
                                                ].includes(userRole) ? (
                                                  <div className="flex items-center space-x-2">
                                                    <Input
                                                      type="date"
                                                      value={
                                                        editedDates[item.id] ||
                                                        item.estimasi_tanggal_perekaman ||
                                                        ""
                                                      }
                                                      onChange={(e) =>
                                                        handleDateChange(
                                                          item.id,
                                                          e.target.value,
                                                        )
                                                      }
                                                      className="h-8 text-xs"
                                                      disabled={saving[item.id]}
                                                    />
                                                    <Button
                                                      size="sm"
                                                      onClick={() =>
                                                        handleSaveDate(item.id)
                                                      }
                                                      disabled={
                                                        saving[item.id] ||
                                                        !editedDates[item.id]
                                                      }
                                                      className="h-8 w-8 p-0"
                                                      aria-label="Simpan tanggal"
                                                    >
                                                      {saving[item.id] ? (
                                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                                      ) : (
                                                        <Save className="h-3 w-3" />
                                                      )}
                                                    </Button>
                                                  </div>
                                                ) : (
                                                  <span className="text-xs text-foreground">
                                                    {formatDate(
                                                      item.estimasi_tanggal_perekaman ||
                                                        undefined,
                                                    )}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Status Toggle for Admin */}
                                        {["admin", "superuser"].includes(
                                          userRole,
                                        ) && (
                                          <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-sm font-medium text-muted-foreground">
                                                Status Perekaman:
                                              </span>
                                              <Badge
                                                variant={
                                                  item.is_ready_to_record
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className={cn(
                                                  "transition-all duration-200",
                                                  item.is_ready_to_record
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                                                )}
                                              >
                                                {item.is_ready_to_record
                                                  ? "Selesai"
                                                  : "Belum Selesai"}
                                              </Badge>
                                            </div>
                                            <Button
                                              variant={
                                                item.is_ready_to_record
                                                  ? "outline"
                                                  : "default"
                                              }
                                              size="sm"
                                              onClick={() =>
                                                handleToggleChange(
                                                  item.id,
                                                  item.is_ready_to_record,
                                                )
                                              }
                                              className="transition-all duration-200"
                                            >
                                              {item.is_ready_to_record
                                                ? "Tandai Belum Selesai"
                                                : "Tandai Selesai"}
                                            </Button>
                                          </div>
                                        )}
                                      </td>
                                    </motion.tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Pagination */}
        {Math.ceil(totalCount / 5) > 0 && (
          <motion.div variants={itemVariants} className="flex justify-center">
            <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
              <CardContent className="p-4">
                <nav
                  className="flex items-center space-x-2"
                  aria-label="Pagination"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="transition-all duration-200"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from(
                    { length: Math.ceil(totalCount / 5) },
                    (_, i) => i + 1,
                  ).map((page) => {
                    const totalPages = Math.ceil(totalCount / 5);
                    const shouldShow =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1) ||
                      (currentPage === 1 && page <= 3) ||
                      (currentPage === totalPages && page >= totalPages - 2);

                    if (!shouldShow && page === currentPage - 2) {
                      return (
                        <span
                          key="ellipsis-prev"
                          className="px-2 py-1 text-muted-foreground"
                          aria-hidden="true"
                        >
                          ...
                        </span>
                      );
                    }

                    if (!shouldShow && page === currentPage + 2) {
                      return (
                        <span
                          key="ellipsis-next"
                          className="px-2 py-1 text-muted-foreground"
                          aria-hidden="true"
                        >
                          ...
                        </span>
                      );
                    }

                    if (!shouldShow) return null;

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="transition-all duration-200"
                        aria-label={`Page ${page}`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onPageChange(
                        Math.min(Math.ceil(totalCount / 5), currentPage + 1),
                      )
                    }
                    disabled={currentPage === Math.ceil(totalCount / 5)}
                    className="transition-all duration-200"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
};

export default SalahRekamTable;