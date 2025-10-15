"use client";

import { useState, useCallback } from "react";
import { Search, RefreshCw, Filter, Download, Plus, FileText, X } from "lucide-react";
import { Button, TextInput, Label } from "flowbite-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface DokumentasiActionsProps {
  /** Current active tab */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tab: string) => void;
  /** Search handler */
  onSearch: (search: string) => void;
  /** Date range change handler */
  onDateRangeChange: (
    startDate: Date | null,
    endDate: Date | null,
    filterBy: "tanggal" | "created_at",
  ) => void;
  /** Refresh handler */
  onRefresh: () => void;
  /** Refresh loading state */
  isRefreshing: boolean;
  /** Custom className */
  className?: string;
  /** Total items count */
  totalItems?: number;
  /** Export handler */
  onExport?: () => void;
}

export default function DokumentasiActions({
  activeTab,
  onTabChange,
  onSearch,
  onDateRangeChange,
  onRefresh,
  isRefreshing,
  className,
  totalItems = 0,
  onExport,
}: DokumentasiActionsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      onSearch(value);
    },
    [onSearch],
  );

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    onSearch("");
  }, [onSearch]);

  const handleDateChange = useCallback(() => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    onDateRangeChange(start, end, "tanggal");
  }, [startDate, endDate, onDateRangeChange]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    onSearch("");
    onDateRangeChange(null, null, "tanggal");
  }, [onSearch, onDateRangeChange]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tabs Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Dokumentasi Management
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Actions Panel</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onTabChange("input")}
            color={activeTab === "input" ? "blue" : "light"}
            className="flex-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Input Dokumentasi
          </Button>
          <Button
            onClick={() => onTabChange("laporan")}
            color={activeTab === "laporan" ? "blue" : "light"}
            className="flex-1"
          >
            <FileText className="mr-2 h-4 w-4" />
            Laporan Dokumentasi
          </Button>
        </div>
      </div>

      {/* Search and Filter Section - Only show on laporan tab */}
      {activeTab === "laporan" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
              <Search className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Search & Filter</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Find and filter dokumentasi
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <TextInput
                type="search"
                placeholder="Cari judul, keterangan, atau author..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={handleSearchClear}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                outline
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                color={showFilters ? "blue" : "gray"}
              >
                <Filter className="h-4 w-4" />
              </Button>

              <Button
                outline
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>

              {onExport && (
                <Button outline size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="startDate" className="mb-2 text-sm font-medium">
                    Tanggal Mulai
                  </Label>
                  <TextInput
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setTimeout(handleDateChange, 100);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="mb-2 text-sm font-medium">
                    Tanggal Akhir
                  </Label>
                  <TextInput
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setTimeout(handleDateChange, 100);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button size="sm" color="gray" onClick={resetFilters}>
                  Reset Filter
                </Button>
                <Button size="sm" onClick={handleDateChange}>
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}

          {/* Results Count */}
          {totalItems > 0 && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Menampilkan {totalItems} dokumentasi
            </div>
          )}
        </div>
      )}
    </div>
  );
}
