"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

// Flowbite Pro component interfaces (simplified for this implementation)
// In a real Flowbite Pro setup, these would be imported from "flowbite-react"
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface TableProps {
  children: React.ReactNode;
  hoverable?: boolean;
  className?: string;
}

interface TableHeadProps {
  children: React.ReactNode;
}

interface TableHeadCellProps {
  children: React.ReactNode;
  className?: string;
  scope?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  size?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
  variant?: string;
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

interface InputProps {
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

// Simplified Flowbite Pro components (in production, import from "flowbite-react")
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const Table: React.FC<TableProps> = ({ children, hoverable = false, className = "" }) => (
  <table className={`w-full text-sm text-left text-gray-500 dark:text-gray-400 ${hoverable ? 'hover' : ''} ${className}`}>
    {children}
  </table>
);

const TableHead: React.FC<TableHeadProps> = ({ children }) => (
  <thead className="text-xs uppercase text-gray-700 bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
    {children}
  </thead>
);

const TableHeadCell: React.FC<TableHeadCellProps> = ({ children, className = "", scope }) => (
  <th scope={scope} className={`px-6 py-3.5 ${className}`}>
    {children}
  </th>
);

const TableBody: React.FC<TableBodyProps> = ({ children }) => (
  <tbody>
    {children}
  </tbody>
);

const TableRow: React.FC<TableRowProps> = ({ children, className = "" }) => (
  <tr className={`border-b dark:border-gray-700 ${className}`}>
    {children}
  </tr>
);

const TableCell: React.FC<TableCellProps> = ({ children, className = "" }) => (
  <td className={`px-6 py-4 ${className}`}>
    {children}
  </td>
);

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  color = "blue",
  size = "md",
  className = "",
  type = "button",
  variant = "solid"
}) => {
  const baseClasses = "inline-flex items-center rounded-lg font-medium focus:outline-none focus:ring-4 transition-all duration-200";
  const colorClasses = {
    blue: "bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    gray: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800",
    red: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800",
    green: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
  };
  const sizeClasses = {
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    sm: "px-3 py-2 text-xs"
  };

  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center rounded-lg border border-transparent p-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-offset-gray-800 ${className}`}
      >
        {children}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700 ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses[color as keyof typeof colorClasses]} ${sizeClasses[size as keyof typeof sizeClasses]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  };

  return (
    <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant as keyof typeof variantClasses]} ${className}`}>
      {children}
    </span>
  );
};

const Input: React.FC<InputProps> = ({
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  className = "",
  "aria-label": ariaLabel
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    aria-label={ariaLabel}
    className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:ring-primary-500 ${className}`}
  />
);

const Label: React.FC<LabelProps> = ({ children, className = "" }) => (
  <label className={`mb-2 block text-sm font-medium text-gray-900 dark:text-white ${className}`}>
    {children}
  </label>
);

import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarIcon,
  UsersIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Flowbite Heroicon integration for consistent iconography
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { useDebounce } from "@/hooks/use-debounce";
import type { DuplicateOperatorData } from "@/types/data-rekam/duplicate-operator";

// Enhanced interface with enterprise-grade features
interface DuplicateOperatorTableProps {
  /** Table data array */
  rekapData: DuplicateOperatorData[];
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
  onEdit: (data: DuplicateOperatorData) => void;
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
  const tableRef = useRef<HTMLDivElement>(null);

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
        .from("duplicate_operator")
        .update({ is_ready_to_record: newStatus })
        .eq("id", id);

      if (error) {
        console.error("Error updating status:", error);
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
        .from("duplicate_operator")
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

  // Accessibility attributes
  const accessibilityProps = {
    role: "table",
    "aria-label": ariaLabel || "Tabel data duplicate operator",
    "aria-describedby": "table-description",
  };

  return (
    <div className={`space-y-6 ${className}`} {...accessibilityProps}>
      {/* Enhanced Filters Section with Flowbite Card */}
      <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Flowbite Heroicon integration for filter icon */}
              <FunnelIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Filter & Pencarian
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {totalCount} total records
            </Badge>
          </div>
          <div className="mt-4 space-y-4">
            {/* Search Input with Flowbite styling */}
            <div className="relative">
              {/* Flowbite Heroicon integration for search icon */}
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                  <XMarkIcon className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Date Filters and Status Filter */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Date pickers would go here - simplified for this implementation */}
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <input
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  disabled={loading}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <input
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  disabled={loading}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Status Filter</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  disabled={loading}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="pending">Belum Selesai</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={onRefresh}
                  disabled={loading}
                  className="w-full transition-all duration-200"
                  size="sm"
                >
                  {loading ? (
                    <>
                      {/* Flowbite Heroicon integration for loading state */}
                      <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {/* Flowbite Heroicon integration for refresh icon */}
                      <ArrowPathIcon className="mr-2 h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Table Section with Flowbite Table */}
      <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Flowbite Heroicon integration for table icon */}
              <ChartBarIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Data Duplicate Operator
              </h3>
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
        </div>
        <div className="overflow-hidden rounded-lg border border-border/50">
          <div className="overflow-x-auto" ref={tableRef}>
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell scope="col" className="w-12">
                    No
                  </TableHeadCell>
                  <TableHeadCell scope="col" className="w-36">
                    Tanggal Pengajuan
                  </TableHeadCell>
                  <TableHeadCell scope="col">
                    NIK / Nama Duplikat
                  </TableHeadCell>
                  <TableHeadCell scope="col">
                    NIK / Nama Operator
                  </TableHeadCell>
                  <TableHeadCell scope="col" className="w-24">
                    Status
                  </TableHeadCell>
                  <TableHeadCell scope="col" className="w-28">
                    Aksi
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rekapData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center space-y-3">
                        {/* Flowbite Heroicon integration for empty state */}
                        <DocumentTextIcon className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-sm font-medium">
                          Tidak ada data yang ditemukan
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Coba ubah filter atau kata kunci pencarian
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rekapData.map((item, index) => {
                    const rowNumber = (currentPage - 1) * 5 + index + 1;
                    const isExpanded = expandedRow === item.id;

                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className="group transition-all duration-200 hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">
                            <div className="flex items-center space-x-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {rowNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            <div className="flex items-center space-x-2">
                              {/* Flowbite Heroicon integration for calendar icon */}
                              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {formatDate(item.tanggal_pengajuan)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                {/* Flowbite Heroicon integration for user icon */}
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {item.nama_duplicate || "-"}
                                </span>
                              </div>
                              <div className="pl-6 text-xs text-muted-foreground">
                                NIK: {item.nik_duplicate || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                {/* Flowbite Heroicon integration for users icon */}
                                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {item.nama_operator || "-"}
                                </span>
                              </div>
                              <div className="pl-6 text-xs text-muted-foreground">
                                NIK: {item.nik_operator || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.is_ready_to_record
                                  ? "success"
                                  : "warning"
                              }
                              className="inline-flex items-center space-x-1 transition-all duration-200"
                            >
                              {item.is_ready_to_record ? (
                                <>
                                  {/* Flowbite Heroicon integration for success icon */}
                                  <CheckCircleIcon className="h-3 w-3" />
                                  <span>Selesai</span>
                                </>
                              ) : (
                                <>
                                  {/* Flowbite Heroicon integration for pending icon */}
                                  <ClockIcon className="h-3 w-3" />
                                  <span>Belum Selesai</span>
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end space-x-1">
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
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                )}
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                className="h-8 w-8 p-0 text-blue-600 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                                aria-label="Edit data"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(item.id)}
                                className="h-8 w-8 p-0 text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                                aria-label="Hapus data"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Enhanced Expanded Row */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="border-t border-border/50 bg-muted/20 px-6 py-6"
                            >
                              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {/* Data Duplikat */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    {/* Flowbite Heroicon integration for section icon */}
                                    <UserIcon className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold text-foreground">
                                      Data Duplikat
                                    </h4>
                                  </div>
                                  <div className="space-y-2 pl-6">
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        NIK:
                                      </span>
                                      <span className="text-xs text-foreground">
                                        {item.nik_duplicate || "-"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Nama:
                                      </span>
                                      <span className="text-xs text-foreground">
                                        {item.nama_duplicate || "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Data Operator */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    {/* Flowbite Heroicon integration for section icon */}
                                    <UsersIcon className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold text-foreground">
                                      Data Operator
                                    </h4>
                                  </div>
                                  <div className="space-y-2 pl-6">
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        NIK:
                                      </span>
                                      <span className="text-xs text-foreground">
                                        {item.nik_operator || "-"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Nama:
                                      </span>
                                      <span className="text-xs text-foreground">
                                        {item.nama_operator || "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Detail Pengajuan */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    {/* Flowbite Heroicon integration for section icon */}
                                    <DocumentTextIcon className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold text-foreground">
                                      Detail Pengajuan
                                    </h4>
                                  </div>
                                  <div className="space-y-2 pl-6">
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
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Tanggal Pengajuan:
                                      </span>
                                      <span className="text-xs text-foreground">
                                        {formatDate(
                                          item.tanggal_pengajuan,
                                        )}
                                      </span>
                                    </div>

                                    {/* Estimasi Tanggal Perekaman */}
                                    <div className="space-y-2">
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Estimasi Perekaman:
                                      </span>
                                      {["admin", "superuser"].includes(userRole) ? (
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
                                              <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <CheckCircleIcon className="h-3 w-3" />
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
                                          ? "success"
                                          : "warning"
                                      }
                                      className="transition-all duration-200"
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
                                        : "solid"
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
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Enhanced Pagination with Flowbite Button components */}
      {Math.ceil(totalCount / 5) > 0 && (
        <Card className="border-border/50 bg-background/80 shadow-lg backdrop-blur-sm">
          <div className="p-4">
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
                <ChevronLeftIcon className="h-4 w-4" />
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
                    variant={currentPage === page ? "solid" : "outline"}
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
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DuplicateOperatorTable;
