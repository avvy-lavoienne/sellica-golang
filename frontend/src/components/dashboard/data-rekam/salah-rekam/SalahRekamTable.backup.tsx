"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/lib/conn/supabaseClient";
import { toast } from "react-toastify";
import type { SalahRekamData } from "@/types/data-rekam/salah-rekam";
import TableSkeleton from "@/components/dashboard/data-rekam/salah-rekam/TableSkeleton";
import { useDebounce } from "@/hooks/use-debounce";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CameraIcon,
  FingerPrintIcon,
  UserMinusIcon,
} from "@heroicons/react/24/outline";

interface SalahRekamTableProps {
  rekapData: SalahRekamData[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (query: string, statusFilter?: string) => void;
  onRefresh: () => void;
  onDataRefresh?: () => void;
  onEdit: (data: SalahRekamData) => void;
  onDelete: (id: string) => void;
  userRole: string;
  loading: boolean;
  className?: string;
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
  className = "",
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editedDates, setEditedDates] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
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
    } else if (!startDate && !endDate) {
      onSearch(searchQuery, statusFilter);
    }
  }, [debouncedStartDate, debouncedEndDate]);

  // Format date helper
  const formatDate = useCallback((dateString: string): string => {
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

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    onSearch("", "all");
  };

  // Status toggle
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!canEdit) {
      toast.error("Hanya admin atau superuser yang dapat mengubah status.");
      return;
    }

    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("salah_rekam")
        .update({ is_ready_to_record: newStatus })
        .eq("id", id);

      if (error) throw new Error(error.message);

      toast.success("Status berhasil diubah!");
      onDataRefresh?.() || onRefresh();
    } catch (error: any) {
      toast.error(`Gagal mengubah status: ${error.message}`);
    }
  };

  // Save date
  const handleSaveDate = async (id: string) => {
    if (!canEdit) {
      toast.error("Hanya admin atau superuser yang dapat mengubah tanggal.");
      return;
    }

    const newDate = editedDates[id];
    if (!newDate) {
      toast.error("Tanggal tidak boleh kosong!");
      return;
    }

    setSaving({ ...saving, [id]: true });

    try {
      const { error } = await supabase
        .from("salah_rekam")
        .update({ estimasi_tanggal_perekaman: newDate })
        .eq("id", id);

      if (error) throw new Error(error.message);

      toast.success("Tanggal berhasil diubah!");
      onDataRefresh?.() || onRefresh();
      setEditedDates({ ...editedDates, [id]: "" });
    } catch (error: any) {
      toast.error(`Gagal menyimpan tanggal: ${error.message}`);
    } finally {
      setSaving({ ...saving, [id]: false });
    }
  };

  // Pagination
  const rowsPerPage = 5;
  const totalPages = Math.ceil(totalCount / rowsPerPage);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters Card */}
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="p-4">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Filter & Pencarian
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Pencarian
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Cari nama atau NIK..."
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Semua</option>
                <option value="ready">Selesai</option>
                <option value="not_ready">Belum Selesai</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4">
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
            >
              <ArrowPathIcon className="mr-2 h-4 w-4" />
              Hapus Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Data Salah Rekam
            </h3>
            <div className="flex items-center space-x-2">
              <span className="rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                Halaman {currentPage}
              </span>
              <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {rekapData.length} dari {totalCount}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Salah Rekam</th>
                  <th className="px-4 py-3">Pemilik Biometric</th>
                  <th className="px-4 py-3">Pemilik Foto</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rekapData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3">
                        <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Tidak ada data yang ditemukan
                        </p>
                        <p className="text-xs text-gray-500">
                          Silakan coba filter atau pencarian yang berbeda
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rekapData.map((item, index) => {
                    const rowNumber = (currentPage - 1) * rowsPerPage + index + 1;
                    const isExpanded = expandedRow === item.id;

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                              {rowNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <UserMinusIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {item.nama_salah_rekam || "-"}
                                </span>
                              </div>
                              <div className="pl-6 text-xs text-gray-500">
                                NIK: {item.nik_salah_rekam || "-"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <FingerPrintIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {item.nama_pemilik_biometric || "-"}
                                </span>
                              </div>
                              <div className="pl-6 text-xs text-gray-500">
                                NIK: {item.nik_pemilik_biometric || "-"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <CameraIcon className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {item.nama_pemilik_foto || "-"}
                                </span>
                              </div>
                              <div className="pl-6 text-xs text-gray-500">
                                NIK: {item.nik_pemilik_foto || "-"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${
                                item.is_ready_to_record
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                              }`}
                            >
                              {item.is_ready_to_record ? (
                                <CheckCircleIcon className="mr-1 h-3 w-3" />
                              ) : (
                                <ClockIcon className="mr-1 h-3 w-3" />
                              )}
                              {item.is_ready_to_record ? "Selesai" : "Belum Selesai"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end space-x-1">
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                                title={isExpanded ? "Tutup Detail" : "Lihat Detail"}
                              >
                                {isExpanded ? (
                                  <ChevronUpIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronDownIcon className="h-5 w-5" />
                                )}
                              </button>
                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => onEdit(item)}
                                    className="rounded-lg p-2 text-primary-600 hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-gray-700"
                                    title="Edit Data"
                                  >
                                    <PencilIcon className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => onDelete(item.id)}
                                    className="rounded-lg p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-gray-700"
                                    title="Hapus Data"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Row */}
                        {isExpanded && (
                          <tr className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                {/* Petugas Rekam */}
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    Petugas Rekam
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">Nama:</span> {item.nama_petugas_rekam || "-"}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">NIK:</span> {item.nik_petugas_rekam || "-"}
                                    </p>
                                  </div>
                                </div>

                                {/* Pengaju */}
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    Pengaju
                                  </h4>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">Nama:</span> {item.nama_pengaju || "-"}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                      <span className="font-medium">NIK:</span> {item.nik_pengaju || "-"}
                                    </p>
                                  </div>
                                </div>

                                {/* Estimasi Tanggal */}
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    Estimasi Tanggal Perekaman
                                  </h4>
                                  {canEdit ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="date"
                                        value={editedDates[item.id] || item.estimasi_tanggal_perekaman || ""}
                                        onChange={(e) => setEditedDates({ ...editedDates, [item.id]: e.target.value })}
                                        className="block w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                      />
                                      <button
                                        onClick={() => handleSaveDate(item.id)}
                                        disabled={saving[item.id] || !editedDates[item.id]}
                                        className="inline-flex items-center rounded-lg bg-primary-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                                      >
                                        {saving[item.id] ? "..." : "Simpan"}
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                      {item.estimasi_tanggal_perekaman ? formatDate(item.estimasi_tanggal_perekaman) : "-"}
                                    </p>
                                  )}
                                </div>

                                {/* Tanggal Perekaman */}
                                <div>
                                  <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    Tanggal Perekaman
                                  </h4>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {item.tanggal_perekaman ? formatDate(item.tanggal_perekaman) : "-"}
                                  </p>
                                </div>

                                {/* Status Toggle */}
                                {canEdit && (
                                  <div>
                                    <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                      Status Siap Rekam
                                    </h4>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                      <input
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={item.is_ready_to_record}
                                        onChange={() => handleToggleStatus(item.id, item.is_ready_to_record)}
                                      />
                                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                        {item.is_ready_to_record ? "Selesai" : "Belum Selesai"}
                                      </span>
                                    </label>
                                  </div>
                                )}
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
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-400">
                Halaman <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> dari{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  Sebelumnya
                </button>
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                >
                  Selanjutnya
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalahRekamTable;
