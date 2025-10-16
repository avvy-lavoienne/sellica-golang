"use client";

import React, { useState, useCallback } from "react";
import { Button, Label, Select, TextInput, Card } from "flowbite-react";
import { Filter, X, Calendar, User } from "lucide-react";

// Utility function for className merging
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  author: string;
  sortBy: "tanggal" | "judul" | "created_at";
  sortOrder: "asc" | "desc";
}

interface DokumentasiFilterProps {
  /** Filter change handler */
  onFilterChange: (filters: FilterOptions) => void;
  /** Authors list for filtering */
  authors?: Array<{ id: string; name: string }>;
  /** Custom className */
  className?: string;
  /** Show/hide state controlled externally */
  isVisible?: boolean;
}

export default function DokumentasiFilter({
  onFilterChange,
  authors = [],
  className,
  isVisible = true,
}: DokumentasiFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: "",
      end: "",
    },
    author: "",
    sortBy: "tanggal",
    sortOrder: "desc",
  });

  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: any) => {
      const newFilters = { ...filters, [key]: value };
      setFilters(newFilters);
      onFilterChange(newFilters);
    },
    [filters, onFilterChange],
  );

  const handleDateRangeChange = useCallback(
    (type: "start" | "end", value: string) => {
      const newDateRange = { ...filters.dateRange, [type]: value };
      handleFilterChange("dateRange", newDateRange);
    },
    [filters.dateRange, handleFilterChange],
  );

  const resetFilters = useCallback(() => {
    const defaultFilters: FilterOptions = {
      dateRange: { start: "", end: "" },
      author: "",
      sortBy: "tanggal",
      sortOrder: "desc",
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  }, [onFilterChange]);

  const hasActiveFilters =
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.author ||
    filters.sortBy !== "tanggal" ||
    filters.sortOrder !== "desc";

  if (!isVisible) return null;

  return (
    <Card className={cn("border border-gray-200 dark:border-gray-700", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filter & Urutkan
            </h3>
          </div>
          {hasActiveFilters && (
            <Button size="xs" color="gray" onClick={resetFilters}>
              <X className="mr-1 h-3 w-3" />
              Reset
            </Button>
          )}
        </div>

        {/* Filter Options */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Date Range Start */}
          <div>
            <Label htmlFor="dateStart" className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tanggal Mulai
            </Label>
            <TextInput
              id="dateStart"
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateRangeChange("start", e.target.value)}
              placeholder="Pilih tanggal mulai"
            />
          </div>

          {/* Date Range End */}
          <div>
            <Label htmlFor="dateEnd" className="mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tanggal Akhir
            </Label>
            <TextInput
              id="dateEnd"
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleDateRangeChange("end", e.target.value)}
              placeholder="Pilih tanggal akhir"
            />
          </div>

          {/* Author Filter */}
          <div>
            <Label htmlFor="author" className="mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Author
            </Label>
            <Select
              id="author"
              value={filters.author}
              onChange={(e) => handleFilterChange("author", e.target.value)}
            >
              <option value="">Semua Author</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <Label htmlFor="sortBy" className="mb-2">
              Urutkan Berdasarkan
            </Label>
            <Select
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) =>
                handleFilterChange("sortBy", e.target.value as FilterOptions["sortBy"])
              }
            >
              <option value="tanggal">Tanggal Dokumentasi</option>
              <option value="created_at">Tanggal Dibuat</option>
              <option value="judul">Judul (A-Z)</option>
            </Select>
          </div>
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Label className="text-sm font-medium">Urutan:</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              color={filters.sortOrder === "desc" ? "blue" : "gray"}
              onClick={() => handleFilterChange("sortOrder", "desc")}
            >
              Terbaru
            </Button>
            <Button
              size="sm"
              color={filters.sortOrder === "asc" ? "blue" : "gray"}
              onClick={() => handleFilterChange("sortOrder", "asc")}
            >
              Terlama
            </Button>
          </div>
        </div>

        {/* Active Filters Info */}
        {hasActiveFilters && (
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Filter Aktif:</strong>{" "}
              {filters.dateRange.start && `Dari ${filters.dateRange.start}`}
              {filters.dateRange.end && ` hingga ${filters.dateRange.end}`}
              {filters.author && ` • Author: ${authors.find((a) => a.id === filters.author)?.name}`}
              {` • Urutan: ${filters.sortOrder === "desc" ? "Terbaru" : "Terlama"}`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

