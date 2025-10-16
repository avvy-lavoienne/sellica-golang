"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import type { AdjudicateRecordData } from "@/types/data-rekam/adjudicate-record";
import { useDebounce } from "@/hooks/use-debounce";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

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
}

interface TextInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  icon?: React.ComponentType<any>;
  className?: string;
  disabled?: boolean;
}

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

interface LabelProps {
  children?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  value?: string;
}

// Simplified Flowbite Pro components (in production, import from "flowbite-react")
const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>
    {children}
  </h3>
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

const TableHeadCell: React.FC<TableHeadCellProps> = ({ children, className = "" }) => (
  <th className={`px-6 py-3 ${className}`}>
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

const TableCell: React.FC<TableCellProps> = ({ children, className = "", colSpan }) => (
  <td className={`px-6 py-4 ${className}`} colSpan={colSpan}>
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
  type = "button"
}) => {
  const baseClasses = "inline-flex items-center rounded-lg font-medium focus:outline-none focus:ring-4 transition-all duration-200";
  const colorClasses = {
    blue: "bg-blue-700 hover:bg-blue-800 text-white focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    gray: "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-800",
    red: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800",
    green: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
  };
  const sizeClasses = {
    xs: "px-3 py-2 text-xs",
    sm: "px-5 py-2.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-5 py-3 text-base"
  };

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

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = "",
  icon: Icon,
  className = "",
  disabled = false
}) => (
  <div className={`relative ${className}`}>
    {Icon && (
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
    )}
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    />
  </div>
);

const Badge: React.FC<BadgeProps> = ({ children, color = "gray", className = "" }) => {
  const colorClasses = {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    failure: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  };

  return (
    <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${colorClasses[color as keyof typeof colorClasses]} ${className}`}>
      {children}
    </span>
  );
};

const Label: React.FC<LabelProps> = ({ children, htmlFor, className = "", value }) => (
  <label htmlFor={htmlFor} className={`mb-2 block text-sm font-medium text-gray-900 dark:text-white ${className}`}>
    {value || children}
  </label>
);

// Enhanced interface with enterprise-grade features
interface AdjudicateRecordTableProps {
  rekapData: AdjudicateRecordData[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string, statusFilter?: string) => void;
  onRefresh: () => void;
  onDataRefresh?: () => void;
  onEdit: (data: AdjudicateRecordData) => void;
  onDelete: (id: string) => void;
  userRole: string;
  loading: boolean;
  className?: string;
  delay?: number;
  disableAnimations?: boolean;
  "aria-label"?: string;
}

const AdjudicateRecordTable: React.FC<AdjudicateRecordTableProps> = ({
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
  // Core state management for adjudicate record functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editedDates, setEditedDates] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Debounced search and date filters for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);

  // Search effect with debouncing
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

  // Date filter handler with validation
  const handleDateFilter = useCallback(() => {
    if (debouncedStartDate && debouncedEndDate) {
      try {
        const start = new Date(debouncedStartDate);
        const end = new Date(debouncedEndDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return;
        }

        const startISO = start.toISOString();
        const endISO = end.toISOString();

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

  // Toggle status handler with permission checks
  const handleToggleChange = async (id: string, currentStatus: boolean) => {
    if (!["admin", "superuser"].includes(userRole)) {
      toast.error("Hanya admin atau superuser yang dapat mengubah status.");
      return;
    }

    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("adjudicate_record")
        .update({ is_ready_to_record: newStatus })
        .eq("id", id);

      if (error) {
        console.error("Error updating status:", error);
        throw new Error(`Gagal mengubah status: ${error.message}`);
      }

      toast.success("Status berhasil diubah!");
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

  // Date editing handlers
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
        .from("adjudicate_record")
        .update({ estimasi_tanggal_perekaman: newDate })
        .eq("id", id);

      if (error) throw new Error(`Gagal menyimpan tanggal: ${error.message}`);

      toast.success("Tanggal berhasil disimpan!");
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

  // Indonesian date formatting utility
  const formatDate = (dateStr?: string | null) => {
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

  // Permission checks for role-based UI
  const canEdit = ["admin", "superuser"].includes(userRole);
  const canDelete = ["admin", "superuser"].includes(userRole);

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Filters skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} role="table" aria-label={ariaLabel || "Tabel data adjudicate record"}>
      {/* Enhanced Filters Section - Flowbite Card with search and filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Flowbite icon integration for filter section */}
              <FunnelIcon className="h-5 w-5 text-blue-600" />
              <CardTitle>Filter & Pencarian</CardTitle>
            </div>
            <Badge color="gray" className="text-xs">
              {totalCount} total records
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search input - Flowbite TextInput with Heroicon */}
            <div className="space-y-2">
              <Label value="Pencarian" />
              <div className="relative">
                <TextInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari data (NIK, Nama, dll.)..."
                  icon={MagnifyingGlassIcon}
                  disabled={loading}
                  className="w-full"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label="Hapus pencarian"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Date filters - Native HTML5 inputs with Flowbite styling */}
            <div className="space-y-2">
              <Label value="Tanggal Mulai" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={loading}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label value="Tanggal Selesai" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={loading}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Status filter - Native select with Flowbite styling */}
            <div className="space-y-2">
              <Label value="Status Filter" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={loading}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Semua Status</option>
                <option value="completed">Selesai</option>
                <option value="pending">Belum Selesai</option>
              </select>
            </div>
          </div>

          {/* Refresh button - Flowbite Button with Heroicon */}
          <div className="mt-4 flex justify-end">
            <Button onClick={onRefresh} disabled={loading} color="gray" size="sm">
              {loading ? (
                <>
                  <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Table Section - Flowbite Table with responsive design */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Flowbite icon integration for table section */}
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
              <CardTitle>Data Adjudicate Record</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge color="gray" className="text-xs">
                Halaman {currentPage}
              </Badge>
              <Badge color="gray" className="text-xs">
                {rekapData.length} dari {totalCount}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell className="w-16">No</TableHeadCell>
                  <TableHeadCell>Tanggal Pengajuan</TableHeadCell>
                  <TableHeadCell>NIK / Nama</TableHeadCell>
                  <TableHeadCell>Jenis Eksepsi</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell className="text-right">Aksi</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rekapData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Tidak ada data yang ditemukan
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                        <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-600">
                          <TableCell className="font-medium">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              {rowNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(item.tanggal_pengajuan)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{item.nama_adjudicate || "-"}</span>
                              </div>
                              <div className="pl-6 text-xs text-gray-500 dark:text-gray-400">
                                NIK: {item.nik_adjudicate || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />
                              <span className="max-w-xs truncate">{item.jenis_eksepsi || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              color={item.is_ready_to_record ? "success" : "warning"}
                              className="inline-flex items-center space-x-1"
                            >
                              {item.is_ready_to_record ? (
                                <CheckCircleIcon className="h-3 w-3" />
                              ) : (
                                <ClockIcon className="h-3 w-3" />
                              )}
                              <span>
                                {item.is_ready_to_record ? "Selesai" : "Belum Selesai"}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              {/* Expand/collapse button - Flowbite button styling */}
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                aria-label={isExpanded ? "Sembunyikan detail" : "Lihat detail"}
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="h-4 w-4" />
                                ) : (
                                  <ChevronDownIcon className="h-4 w-4" />
                                )}
                              </button>

                              {/* Edit button - Flowbite button with permission check */}
                              {canEdit && (
                                <button
                                  onClick={() => onEdit(item)}
                                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-gray-700"
                                  aria-label="Edit data"
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </button>
                              )}

                              {/* Delete button - Flowbite button with permission check */}
                              {canDelete && (
                                <button
                                  onClick={() => onDelete(item.id)}
                                  className="rounded-lg p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-gray-700"
                                  aria-label="Hapus data"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Row - Flowbite expandable content */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                              <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                                {/* Data Adjudicate Section */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      Data Adjudicate
                                    </h4>
                                  </div>
                                  <div className="space-y-2 pl-6">
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NIK:</span>
                                      <span className="text-xs text-gray-900 dark:text-white">{item.nik_adjudicate || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nama:</span>
                                      <span className="text-xs text-gray-900 dark:text-white">{item.nama_adjudicate || "-"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Data Pengaju Section */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <UserIcon className="h-4 w-4 text-blue-600" />
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      Data Pengaju
                                    </h4>
                                  </div>
                                  <div className="space-y-2 pl-6">
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NIK:</span>
                                      <span className="text-xs text-gray-900 dark:text-white">{item.nik_pengaju || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nama:</span>
                                      <span className="text-xs text-gray-900 dark:text-white">{item.nama_pengaju || "-"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Detail Pengajuan Section */}
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-2">
                                    <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                      Detail Pengajuan
                                    </h4>
                                  </div>
                                  <div className="space-y-2 pl-6">
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Jenis Eksepsi:</span>
                                      <span className="max-w-32 break-words text-right text-xs text-gray-900 dark:text-white">
                                        {item.jenis_eksepsi || "-"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tanggal Pengajuan:</span>
                                      <span className="text-xs text-gray-900 dark:text-white">
                                        {formatDate(item.tanggal_pengajuan)}
                                      </span>
                                    </div>

                                    {/* Date editing for admin - Flowbite input integration */}
                                    {canEdit && (
                                      <div className="space-y-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                          Estimasi Perekaman:
                                        </span>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="date"
                                            value={editedDates[item.id] || item.estimasi_tanggal_perekaman || ""}
                                            onChange={(e) => handleDateChange(item.id, e.target.value)}
                                            className="h-8 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            disabled={saving[item.id]}
                                          />
                                          <Button
                                            size="xs"
                                            onClick={() => handleSaveDate(item.id)}
                                            disabled={saving[item.id] || !editedDates[item.id]}
                                            className="h-8 w-8 p-0"
                                          >
                                            {saving[item.id] ? (
                                              <ArrowPathIcon className="h-3 w-3 animate-spin" />
                                            ) : (
                                              <CloudArrowUpIcon className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Status Toggle for Admin - Flowbite button integration */}
                              {canEdit && (
                                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                      Status Perekaman:
                                    </span>
                                    <Badge
                                      color={item.is_ready_to_record ? "success" : "warning"}
                                    >
                                      {item.is_ready_to_record ? "Selesai" : "Belum Selesai"}
                                    </Badge>
                                  </div>
                                  <Button
                                    color={item.is_ready_to_record ? "gray" : "blue"}
                                    size="sm"
                                    onClick={() => handleToggleChange(item.id, item.is_ready_to_record)}
                                  >
                                    {item.is_ready_to_record ? "Tandai Belum Selesai" : "Tandai Selesai"}
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
        </CardContent>
      </Card>

      {/* Enhanced Pagination - Flowbite button integration */}
      {Math.ceil(totalCount / 5) > 0 && (
        <div className="flex justify-center">
          <Card>
            <CardContent className="p-4">
              <nav className="flex items-center space-x-2" aria-label="Pagination">
                <Button
                  color="gray"
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronUpIcon className="h-4 w-4 rotate-90" />
                </Button>

                {Array.from({ length: Math.ceil(totalCount / 5) }, (_, i) => i + 1)
                  .filter((page) => {
                    const totalPages = Math.ceil(totalCount / 5);
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1) ||
                      (currentPage === 1 && page <= 3) ||
                      (currentPage === totalPages && page >= totalPages - 2)
                    );
                  })
                  .map((page, index, array) => {
                    const totalPages = Math.ceil(totalCount / 5);
                    const shouldShowEllipsis =
                      index > 0 && page - array[index - 1] > 1;

                    return (
                      <React.Fragment key={page}>
                        {shouldShowEllipsis && (
                          <span className="px-2 py-1 text-gray-500 dark:text-gray-400" aria-hidden="true">
                            ...
                          </span>
                        )}
                        <Button
                          color={currentPage === page ? "blue" : "gray"}
                          size="sm"
                          onClick={() => onPageChange(page)}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  })}

                <Button
                  color="gray"
                  size="sm"
                  onClick={() => onPageChange(Math.min(Math.ceil(totalCount / 5), currentPage + 1))}
                  disabled={currentPage === Math.ceil(totalCount / 5)}
                >
                  <ChevronUpIcon className="h-4 w-4 -rotate-90" />
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdjudicateRecordTable;