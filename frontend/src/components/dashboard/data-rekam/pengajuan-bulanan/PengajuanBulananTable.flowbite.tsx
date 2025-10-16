"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import type { PengajuanBulananData } from "@/types/data-rekam/pengajuan-bulanan";
import { useDebounce } from "@/hooks/use-debounce";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { id as idLocale } from "date-fns/locale";
import TableSkeleton from "@/components/dashboard/data-rekam/pengajuan-bulanan/TableSkeleton";

interface PengajuanBulananTableProps {
  rekapData: PengajuanBulananData[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string, statusFilter?: string) => void;
  onRefresh: () => void;
  onDataRefresh?: () => void;
  onEdit: (data: PengajuanBulananData) => void;
  onDelete: (id: string) => void;
  onAjukan: () => void;
  userRole: string;
  loading: boolean;
  className?: string;
  "aria-label"?: string;
}

const PengajuanBulananTable: React.FC<PengajuanBulananTableProps> = ({
  rekapData,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onRefresh,
  onDataRefresh,
  onEdit,
  onDelete,
  onAjukan,
  userRole,
  loading,
  className = "",
  "aria-label": ariaLabel = "Tabel Pengajuan Bulanan",
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editedDates, setEditedDates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Debounced values
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);

  // Permission check
  const canEdit = ["admin", "superuser"].includes(userRole);

  // Search effect
  useEffect(() => {
    if (searchQuery === "" && !startDate && !endDate) {
      onSearch("", statusFilter);
      return;
    }
    onSearch(debouncedSearchQuery, statusFilter);
  }, [debouncedSearchQuery, statusFilter]);

  // Date filter effect
  useEffect(() => {
    if (debouncedStartDate && debouncedEndDate) {
      try {
        const formattedStart = new Date(debouncedStartDate);
        formattedStart.setUTCHours(0, 0, 0, 0);

        const formattedEnd = new Date(debouncedEndDate);
        formattedEnd.setUTCHours(23, 59, 59, 999);

        const query = `created_at >= '${formattedStart.toISOString()}' AND created_at <= '${formattedEnd.toISOString()}'`;
        onSearch(query, statusFilter);
      } catch (error) {
        onSearch("", statusFilter);
      }
    } else if (!startDate && !endDate && !searchQuery) {
      onSearch("", statusFilter);
    }
  }, [debouncedStartDate, debouncedEndDate]);

  // Format date helper (Indonesian locale)
  const formatDate = useCallback((dateString?: string): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return "-";
    }
  }, []);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate(null);
    setEndDate(null);
    setStatusFilter("all");
    onSearch("", "all");
  };

  // Toggle ready status (admin only)
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!canEdit) {
      toast.error("Hanya admin atau superuser yang dapat mengubah status.");
      return;
    }

    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("pengajuan_bulanan")
        .update({ is_ready_to_record: newStatus })
        .eq("id", id);

      if (error) throw new Error(error.message);

      toast.success(`Status berhasil diubah menjadi ${newStatus ? "Siap" : "Belum Siap"}!`);
      onDataRefresh?.() || onRefresh();
    } catch (error: any) {
      toast.error(`Gagal mengubah status: ${error.message}`);
    }
  };

  // Handle date input change
  const handleDateChange = (id: string, value: string) => {
    setEditedDates((prev) => ({ ...prev, [id]: value }));
  };

  // Save estimated recording date (admin only)
  const handleSaveDate = async (id: string) => {
    if (!canEdit) {
      toast.error("Hanya admin atau superuser yang dapat mengubah tanggal.");
      return;
    }

    const newDate = editedDates[id];
    if (!newDate) {
      toast.error("Tanggal tidak boleh kosong.");
      return;
    }

    setSaving((prev) => ({ ...prev, [id]: true }));

    try {
      const { error } = await supabase
        .from("pengajuan_bulanan")
        .update({ estimasi_tanggal_perekaman: newDate })
        .eq("id", id);

      if (error) throw new Error(error.message);

      toast.success("Tanggal berhasil diperbarui!");
      setEditedDates((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      onDataRefresh?.() || onRefresh();
    } catch (error: any) {
      toast.error(`Gagal memperbarui tanggal: ${error.message}`);
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Get alasan badge styling (reason for submission)
  const getAlasanBadge = (alasan: string) => {
    // Map alasan to colors
    if (alasan.toLowerCase().includes("kelahiran")) {
      return {
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    } else if (alasan.toLowerCase().includes("kematian")) {
      return {
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
    } else if (alasan.toLowerCase().includes("hapus") || alasan.toLowerCase().includes("koreksi")) {
      return {
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      };
    } else {
      return {
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    }
  };

  // Pagination calculations
  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const startRow = (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalCount);

  // Show loading skeleton
  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className={`relative ${className}`} aria-label={ariaLabel}>
      {/* Search & Filter Bar */}
      <div className="mb-4 space-y-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama lengkap, nama pengaju, atau NIK..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            aria-label="Refresh data"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>

        {/* Date Range Filter & Status Filter */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={idLocale}>
              <div className="flex-1">
                <DatePicker
                  label="Tanggal Mulai"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      className: "bg-gray-50 dark:bg-gray-700 rounded-lg",
                    },
                  }}
                />
              </div>
              <div className="flex-1">
                <DatePicker
                  label="Tanggal Akhir"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      className: "bg-gray-50 dark:bg-gray-700 rounded-lg",
                    },
                  }}
                />
              </div>
            </LocalizationProvider>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">Semua Status</option>
              <option value="ready">Siap Rekam</option>
              <option value="pending">Belum Siap</option>
            </select>

            {(searchQuery || startDate || endDate || statusFilter !== "all") && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-3">
                  No
                </th>
                <th scope="col" className="px-6 py-3">
                  Tanggal Pengajuan
                </th>
                <th scope="col" className="px-6 py-3">
                  Nama Pengajuan
                </th>
                <th scope="col" className="px-6 py-3">
                  Alasan Pengajuan
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rekapData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Tidak ada data pengajuan bulanan
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rekapData.map((item, index) => {
                  const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
                  const isExpanded = expandedRow === item.id;
                  const alasanBadge = getAlasanBadge(item.alasan_pengajuan);

                  return (
                    <React.Fragment key={item.id}>
                      {/* Main Row */}
                      <tr
                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                        onClick={(e) => {
                          // Don't expand if clicking on buttons/inputs
                          const target = e.target as HTMLElement;
                          if (
                            target.tagName === "BUTTON" ||
                            target.tagName === "INPUT" ||
                            target.closest("button") ||
                            target.closest("input")
                          ) {
                            return;
                          }
                          toggleRowExpansion(item.id);
                        }}
                      >
                        {/* Row Number */}
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                            )}
                            {rowNumber}
                          </div>
                        </td>

                        {/* Submission Date */}
                        <td className="px-6 py-4">{formatDate(item.tanggal_pengajuan)}</td>

                        {/* Nama Pengajuan with NIK below */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.nama_pengajuan || "-"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              NIK: {item.nik_pengajuan_hapus || "-"}
                            </div>
                          </div>
                        </td>

                        {/* Alasan Pengajuan */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full ${alasanBadge.className}`}
                          >
                            {item.alasan_pengajuan || "-"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {canEdit ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(item.id, item.is_ready_to_record);
                              }}
                              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                item.is_ready_to_record
                                  ? "bg-green-600"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                              aria-label={`Toggle status ${item.nama_pengajuan}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  item.is_ready_to_record ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          ) : (
                            <span
                              className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                item.is_ready_to_record
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                              }`}
                            >
                              {item.is_ready_to_record ? "Siap" : "Belum Siap"}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              aria-label={`Edit ${item.nama_pengajuan}`}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              aria-label={`Delete ${item.nama_pengajuan}`}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Detail Pengajuan
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Alasan Lengkap:
                                  </span>
                                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                                    {item.alasan_pengajuan || "-"}
                                  </p>
                                  {item.alasan_lainnya && (
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                                      Detail: {item.alasan_lainnya}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Nama Pengaju:
                                  </span>
                                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                                    {item.nama_pengaju}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    NIK Pengaju:
                                  </span>
                                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                                    {item.nik_pengaju}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Estimasi Tanggal Perekaman:
                                  </span>
                                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                                    {formatDate(item.estimasi_tanggal_perekaman || undefined)}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Tanggal Dibuat:
                                  </span>
                                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                                    {formatDate(item.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
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

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 gap-4">
            {/* Results Info */}
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Menampilkan <span className="font-medium">{startRow}</span> -{" "}
              <span className="font-medium">{endRow}</span> dari{" "}
              <span className="font-medium">{totalCount}</span> data
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span
                        key={page}
                        className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      currentPage === page
                        ? "text-white bg-blue-600 hover:bg-blue-700"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                    }`}
                    aria-label={`Go to page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                aria-label="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PengajuanBulananTable;
