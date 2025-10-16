"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import { useDebounce } from "@/hooks/use-debounce";
import type { PengajuanBulananData } from "@/types/data-rekam/pengajuan-bulanan";
import TableSkeleton from "@/components/dashboard/data-rekam/pengajuan-bulanan/TableSkeleton";
import EmptyState from "@/components/dashboard/data-rekam/pengajuan-bulanan/EmptyState";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ClipboardIcon,
  PhoneIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Enhanced interface with enterprise-grade features
interface PengajuanBulananTableProps {
  /** Table data array */
  rekapData: PengajuanBulananData[];
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
  onEdit: (data: PengajuanBulananData) => void;
  /** Delete handler */
  onDelete: (id: string) => void;
  /** Ajukan handler */
  onAjukan: () => void;
  /** User role for permissions */
  userRole: string;
  /** Loading state */
  loading: boolean;
  /** Custom className for styling */
  className?: string;
  /** Custom aria-label for accessibility */
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
  className,
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

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (searchQuery === "" && (!startDate || !endDate)) {
      onSearch("", statusFilter);
      return;
    }

    const timeout = setTimeout(() => {
      onSearch(searchQuery, statusFilter);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery, statusFilter, onSearch, endDate, startDate]);

  const handleDateFilter = useCallback(() => {
    if (startDate && endDate) {
      try {
        // Validate that both dates are valid Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return;
        }

        // Convert startDate to the beginning of the day in UTC
        const formattedStartDate = new Date(start);
        formattedStartDate.setUTCHours(0, 0, 0, 0);

        // Convert endDate to the end of the day in UTC
        const formattedEndDate = new Date(end);
        formattedEndDate.setUTCHours(23, 59, 59, 999);

        // Ensure year values are properly formatted with 4 digits
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

        // Construct the query using ISO 8601 format
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
  }, [startDate, endDate, statusFilter, onSearch]);

  useEffect(() => {
    handleDateFilter();
  }, [startDate, endDate, handleDateFilter]);

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
        .from("pengajuan_bulanan")
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
        .from("pengajuan_bulanan")
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    onSearch("", "all");
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className={`space-y-6 ${className || ""}`} role="region" aria-label={ariaLabel || "Tabel data pengajuan bulanan"}>
      {/* Enhanced Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <MagnifyingGlassIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter & Pencarian
              </h3>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {totalCount} total records
            </span>
          </div>

          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
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
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Date Filters and Status Filter */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                  className="block w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={loading}
                  className="block w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="block w-full px-3 py-2 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="all">Semua Status</option>
                  <option value="completed">Selesai</option>
                  <option value="pending">Belum Selesai</option>
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <button
                  onClick={handleClearFilters}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Reset
                </button>
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-700 border border-transparent rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Pengajuan Bulanan
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                Halaman {currentPage}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {rekapData.length} dari {totalCount}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">No</th>
                <th scope="col" className="px-6 py-3">Tanggal Pengajuan</th>
                <th scope="col" className="px-6 py-3">NIK / Nama</th>
                <th scope="col" className="px-6 py-3">Alasan Pengajuan</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rekapData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Tidak ada data yang ditemukan
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-700 border border-transparent rounded-lg hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                rekapData.map((item, index) => {
                  const rowNumber = (currentPage - 1) * 5 + index + 1;
                  const isExpanded = expandedRow === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {rowNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(item.tanggal_pengajuan)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <UserIcon className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{item.nama_pengajuan || "-"}</span>
                            </div>
                            <div className="pl-6 text-xs text-gray-500 dark:text-gray-400">
                              NIK: {item.nik_pengajuan_hapus || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <ClipboardIcon className="h-4 w-4 text-gray-400" />
                            <span className="max-w-xs truncate">{item.alasan_pengajuan || "-"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.is_ready_to_record
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}>
                            {item.is_ready_to_record ? (
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                            ) : (
                              <ClockIcon className="w-3 h-3 mr-1" />
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
                                <ChevronUpIcon className="h-4 w-4" />
                              ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              onClick={() => onEdit(item)}
                              className="inline-flex items-center p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                              title="Edit data"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => onDelete(item.id)}
                              className="inline-flex items-center p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                              title="Hapus data"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td colSpan={6} className="px-6 py-6 bg-gray-50 dark:bg-gray-700/50">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                              {/* Data Pengajuan */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Data Pengajuan
                                  </h4>
                                </div>
                                <div className="space-y-2 pl-6">
                                  <div className="flex justify-between">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">NIK:</span>
                                    <span className="text-xs text-gray-900 dark:text-white">{item.nik_pengajuan_hapus || "-"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Nama:</span>
                                    <span className="text-xs text-gray-900 dark:text-white">{item.nama_pengajuan || "-"}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Data Pengaju */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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

                              {/* Detail Pengajuan */}
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Detail Pengajuan
                                  </h4>
                                </div>
                                <div className="space-y-2 pl-6">
                                  <div className="flex justify-between">
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Alasan:</span>
                                    <span className="max-w-32 break-words text-right text-xs text-gray-900 dark:text-white">{item.alasan_pengajuan || "-"}</span>
                                  </div>
                                  {item.alasan_lainnya && (
                                    <div className="flex justify-between">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Alasan Lainnya:</span>
                                      <span className="max-w-32 break-words text-right text-xs text-gray-900 dark:text-white">{item.alasan_lainnya}</span>
                                    </div>
                                  )}
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
                                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <CheckCircleIcon className="w-3 h-3" />
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

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4">
              <nav className="flex items-center justify-between" aria-label="Pagination">
                <div className="text-sm text-gray-700 dark:text-gray-400">
                  Halaman <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> dari{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    aria-label="Previous page"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const shouldShow = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1) ||
                        (currentPage === 1 && page <= 3) || (currentPage === totalPages && page >= totalPages - 2);
                      return shouldShow;
                    })
                    .map(page => {
                      if (page === currentPage - 2 && currentPage > 3) {
                        return (
                          <span key="ellipsis-prev" className="px-3 py-2 text-gray-500 dark:text-gray-400" aria-hidden="true">
                            ...
                          </span>
                        );
                      }
                      if (page === currentPage + 2 && currentPage < totalPages - 2) {
                        return (
                          <span key="ellipsis-next" className="px-3 py-2 text-gray-500 dark:text-gray-400" aria-hidden="true">
                            ...
                          </span>
                        );
                      }
                      if (page === currentPage - 2 || page === currentPage + 2) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => onPageChange(page)}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium border rounded-lg ${
                            currentPage === page
                              ? "text-white bg-blue-700 border-blue-700 hover:bg-blue-800"
                              : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                          }`}
                          aria-label={`Page ${page}`}
                          aria-current={currentPage === page ? "page" : undefined}
                        >
                          {page}
                        </button>
                      );
                    })}

                  <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PengajuanBulananTable;
