"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of items across all pages
   */
  totalItems: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Callback when page size changes
   */
  onPageSizeChange: (pageSize: number) => void;

  /**
   * Available page size options
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: number[];

  /**
   * Loading state (disables all controls)
   */
  loading?: boolean;

  /**
   * Custom class name for container
   */
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
  className = "",
}: TablePaginationProps) {
  // Calculate pagination metadata
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Navigation handlers
  const goToFirstPage = () => onPageChange(1);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => onPageChange(totalPages);

  // Disable conditions
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages || totalPages === 0;
  const isDisabled = loading || totalItems === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-lg ${className}`}
    >
      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          Tampilkan
        </span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-[80px] h-9 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <SelectValue placeholder={pageSize.toString()} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            {pageSizeOptions.map((option) => (
              <SelectItem
                key={option}
                value={option.toString()}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          per halaman
        </span>
      </div>

      {/* Current Range Display */}
      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">
        {totalItems === 0 ? (
          <span>Tidak ada data</span>
        ) : (
          <span>
            Menampilkan{" "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {startItem}
            </span>
            {" - "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {endItem}
            </span>
            {" dari "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {totalItems}
            </span>
            {" tiket"}
          </span>
        )}
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToFirstPage}
          disabled={isDisabled || isFirstPage}
          className="h-9 w-9 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman pertama"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Halaman pertama</span>
        </Button>

        {/* Previous Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousPage}
          disabled={isDisabled || isFirstPage}
          className="h-9 w-9 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Halaman sebelumnya</span>
        </Button>

        {/* Current Page Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 min-w-[100px] justify-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Hal.{" "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {currentPage}
            </span>
            {" dari "}
            <span className="font-semibold">
              {totalPages || 1}
            </span>
          </span>
        </div>

        {/* Next Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextPage}
          disabled={isDisabled || isLastPage}
          className="h-9 w-9 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Halaman berikutnya</span>
        </Button>

        {/* Last Page */}
        <Button
          variant="ghost"
          size="icon"
          onClick={goToLastPage}
          disabled={isDisabled || isLastPage}
          className="h-9 w-9 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Halaman terakhir"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Halaman terakhir</span>
        </Button>
      </div>
    </motion.div>
  );
}
